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
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            card_image: true,
            cover_image: true,
            _count: {
              select: { sections: true }
            },
            sections: {
              select: {
                _count: {
                  select: {
                    lessons: {
                      where: {
                        OR: [
                          { is_targeted: false },
                          { accessible_to: { some: { student_id: studentId } } }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        },
        lesson_progress: {
          where: { is_completed: true },
          select: { id: true }
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
        card_image: enrollment.course.card_image,
        cover_image: enrollment.course.cover_image,
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
      select: {
        watch_position_seconds: true,
        last_watched_at: true,
        lesson_id: true,
        lesson: {
          select: {
            id: true,
            title: true,
            section_id: true,
            section: {
              select: {
                id: true,
                title: true,
                course_id: true,
                course: {
                  select: {
                    id: true,
                    title: true,
                    thumbnail: true,
                    card_image: true,
                    cover_image: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!lastProgress) return null;

    return {
      courseId: lastProgress.lesson.section.course_id,
      courseTitle: lastProgress.lesson.section.course.title,
      thumbnail: lastProgress.lesson.section.course.thumbnail,
      card_image: lastProgress.lesson.section.course.card_image,
      cover_image: lastProgress.lesson.section.course.cover_image,
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
            sections: {
              include: {
                _count: {
                  select: {
                    lessons: {
                      where: {
                        OR: [
                          { is_targeted: false },
                          { accessible_to: { some: { student_id: studentId } } }
                        ]
                      }
                    }
                  }
                }
              }
            } 
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

  /**
   * Unified Student Classroom API: returns student info, course info, progress tracking, and accessible curriculum.
   */
  public static async getStudentClassroom(studentId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
      select: {
        status: true,
        enrolled_at: true,
        progress_percentage: true,
        completed_at: true,
        student: {
          select: { id: true, full_name: true, email: true, profile_picture: true }
        },
        course_progress: {
          select: { last_watched_lesson_id: true }
        },
        lesson_progress: {
          select: { lesson_id: true, is_completed: true, watch_position_seconds: true, last_watched_at: true }
        }
      }
    });

    if (!enrollment || enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new Error('Forbidden: You do not have an active enrollment in this course');
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        language: true,
        thumbnail: true,
        cover_image: true,
        instructor: {
          select: { id: true, full_name: true, profile_picture: true }
        },
        sections: {
          orderBy: { sequence_order: 'asc' },
          select: {
            id: true,
            title: true,
            sequence_order: true,
            lessons: {
              where: {
                OR: [
                  { is_targeted: false },
                  { accessible_to: { some: { student_id: studentId } } }
                ]
              },
              orderBy: { sequence_order: 'asc' },
              select: {
                id: true,
                title: true,
                duration: true,
                video_url: true,
                is_free_preview: true,
                is_targeted: true,
                sequence_order: true
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new Error('Not Found: Course not found');
    }

    const progressMap = new Map();
    enrollment.lesson_progress.forEach((p) => {
      progressMap.set(p.lesson_id, p);
    });

    let totalLessons = 0;
    let completedLessonsCount = 0;
    const completedLessonIds: string[] = [];

    const curriculum = course.sections.map((section) => {
      const lessons = section.lessons.map((lesson) => {
        totalLessons++;
        const p = progressMap.get(lesson.id);
        const isCompleted = p?.is_completed || false;
        const watchPosition = p?.watch_position_seconds || 0;
        if (isCompleted) {
          completedLessonsCount++;
          completedLessonIds.push(lesson.id);
        }
        return {
          lesson_id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          video_url: lesson.video_url,
          sequence_order: lesson.sequence_order,
          is_free_preview: lesson.is_free_preview,
          is_targeted: lesson.is_targeted,
          is_completed: isCompleted,
          watch_position_seconds: watchPosition,
          last_watched_at: p?.last_watched_at || null
        };
      });

      return {
        section_id: section.id,
        title: section.title,
        sequence_order: section.sequence_order,
        lessons
      };
    });

    const calculatedPercentage = totalLessons === 0 ? 0 : Math.round((completedLessonsCount / totalLessons) * 100 * 100) / 100;

    return {
      student_info: {
        id: enrollment.student.id,
        full_name: enrollment.student.full_name,
        email: enrollment.student.email,
        profile_picture: enrollment.student.profile_picture,
        enrolled_at: enrollment.enrolled_at,
        enrollment_status: enrollment.status
      },
      course_info: {
        id: course.id,
        title: course.title,
        description: course.description,
        level: course.level,
        language: course.language,
        thumbnail: course.thumbnail,
        cover_image: course.cover_image,
        instructor: course.instructor
      },
      progress_metrics: {
        progress_percentage: calculatedPercentage,
        completed_lessons_count: completedLessonsCount,
        total_accessible_lessons: totalLessons,
        last_watched_lesson_id: enrollment.course_progress?.last_watched_lesson_id || null,
        completed_lesson_ids: completedLessonIds,
        completed_at: enrollment.completed_at
      },
      curriculum
    };
  }
}
