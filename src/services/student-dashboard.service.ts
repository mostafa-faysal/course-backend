import { PrismaClient, EnrollmentStatus } from '@prisma/client';
import { NotificationHelper } from '../helpers/notification.helper';

const prisma = new PrismaClient();

export class StudentDashboardService {
  /**
   * High-level metrics using native aggregations to prevent memory load.
   */
  public static async getDashboardOverview(studentId: string) {
    const [
      enrolledCount,
      completedCoursesCount,
      certificatesCount,
      pendingAssignmentsCount
    ] = await Promise.all([
      // Total active enrollments
      prisma.enrollment.count({
        where: { student_id: studentId, status: EnrollmentStatus.ACTIVE }
      }),
      
      // Fully completed courses (assuming enrollment tracks this, or via progress)
      // Here we assume completed_at exists on Enrollment if finished, or we check progress.
      // Wait, let's see if Enrollment has a status or completion flag. 
      // For now, let's count certificates as a proxy for completed courses, 
      // or check LessonProgress if all lessons are completed.
      // Let's rely on certificates as the definitive completion state for performance.
      prisma.certificate.count({
        where: { student_id: studentId }
      }),

      // Certificates earned
      prisma.certificate.count({
        where: { student_id: studentId }
      }),

      // Pending assignments
      // This is slightly complex via pure SQL, we might need a custom raw query 
      // or we can fetch the active courses and count assignments without submissions.
      // For now we'll do a simple Prisma count of assignments where no submission exists for this student.
      prisma.assignment.count({
        where: {
          course: {
            enrollments: {
              some: { student_id: studentId, status: EnrollmentStatus.ACTIVE }
            }
          },
          submissions: {
            none: { student_id: studentId }
          }
        }
      })
    ]);

    return {
      enrolledCourses: enrolledCount,
      completedCourses: completedCoursesCount, // Fallback to certificates count
      certificatesEarned: certificatesCount,
      pendingAssignments: pendingAssignmentsCount
    };
  }

  /**
   * Enrolled courses with aggregated progress.
   */
  public static async getMyCourses(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId, status: EnrollmentStatus.ACTIVE },
      include: {
        course: {
          include: {
            _count: {
              select: { sections: true }
            },
            sections: {
              include: {
                _count: { select: { lessons: true } }
              }
            }
          }
        },
        lesson_progress: {
          where: { is_completed: true }
        }
      },
      orderBy: { enrolled_at: 'desc' }
    });

    return enrollments.map(enrollment => {
      const totalLessons = enrollment.course.sections.reduce((acc, sec) => acc + sec._count.lessons, 0);
      const completedLessons = enrollment.lesson_progress.length;
      const progressPercentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        thumbnail: enrollment.course.thumbnail,
        progressPercentage,
        enrolledAt: enrollment.enrolled_at,
        completedLessons,
        totalLessons
      };
    });
  }

  /**
   * Fetches the exact lesson the student should resume watching.
   */
  public static async getContinueWatching(studentId: string) {
    // Find the single most recently watched lesson across all active enrollments
    const lastProgress = await prisma.lessonProgress.findFirst({
      where: {
        enrollment: {
          student_id: studentId,
          status: EnrollmentStatus.ACTIVE
        },
        last_watched_at: { not: null }
      },
      orderBy: { last_watched_at: 'desc' },
      include: {
        lesson: {
          include: { section: { include: { course: true } } }
        }
      }
    });

    if (!lastProgress) return null;

    return {
      courseId: lastProgress.lesson.section.course_id,
      courseTitle: lastProgress.lesson.section.course.title,
      sectionId: lastProgress.lesson.section_id,
      sectionTitle: lastProgress.lesson.section.title,
      lessonId: lastProgress.lesson_id,
      lessonTitle: lastProgress.lesson.title,
      watchPositionSeconds: lastProgress.watch_position_seconds,
      lastWatchedAt: lastProgress.last_watched_at
    };
  }

  /**
   * Certificate Management
   */
  public static async getCertificates(studentId: string) {
    return prisma.certificate.findMany({
      where: { student_id: studentId },
      include: { course: { select: { title: true, instructor: { select: { full_name: true } } } } },
      orderBy: { issued_at: 'desc' }
    });
  }

  public static async verifyCertificate(credentialId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { credential_id: credentialId },
      include: {
        student: { select: { full_name: true } },
        course: { select: { title: true, instructor: { select: { full_name: true } } } }
      }
    });

    if (!certificate) throw new Error('Invalid or fake certificate');

    return certificate;
  }

  public static async claimCertificate(studentId: string, courseId: string) {
    // Check existing certificate
    const existing = await prisma.certificate.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
    });

    if (existing) return existing; // Already claimed

    // Verify 100% completion
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
      include: {
        course: { 
          include: { 
            sections: { include: { _count: { select: { lessons: true } } } } 
          } 
        },
        lesson_progress: { where: { is_completed: true } }
      }
    });

    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new Error('Forbidden: Active enrollment required');
    }

    const totalLessons = enrollment.course.sections.reduce((acc, sec) => acc + sec._count.lessons, 0);
    const completedLessons = enrollment.lesson_progress.length;

    if (totalLessons === 0 || completedLessons < totalLessons) {
      throw new Error('Forbidden: Course not fully completed yet');
    }

    // Generate certificate record
    const certificate = await prisma.certificate.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        title: `Certificate of Completion: ${enrollment.course.title}`
      }
    });
    // Notify Student
    await NotificationHelper.sendCertificateIssued(studentId, certificate.id, enrollment.course.title);

    return certificate;
  }
}
