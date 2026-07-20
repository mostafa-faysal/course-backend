import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class EnrollmentService {
  /**
   * Enroll a student in a course
   */
  public static async enrollStudent(studentId: string, courseId: string) {
    // 1. Verify course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true, price: true },
    });

    if (!course || course.status !== 'PUBLISHED') {
      throw new Error('Course not found');
    }

    // 2. Business Rule: Phase 6 - Free courses only
    if (course.price > 0) {
      throw new Error('Paid courses require purchase before enrollment');
    }

    // 3. Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this course');
    }

    // 4. Create enrollment and initialize course progress
    return prisma.$transaction(async (tx) => {
      const newEnrollment = await tx.enrollment.create({
        data: {
          student_id: studentId,
          course_id: courseId,
          progress_percentage: 0.0,
        },
        select: {
          id: true,
          student_id: true,
          course_id: true,
          progress_percentage: true,
          enrolled_at: true,
        },
      });

      await tx.courseProgress.create({
        data: {
          enrollment_id: newEnrollment.id,
          last_watched_lesson_id: null,
        },
      });

      return newEnrollment;
    }, {
      maxWait: 10000,
      timeout: 15000,
    });
  }

  /**
   * Get enrolled courses for a student
   */
  public static async getMyCourses(studentId: string) {
    return prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: {
        id: true,
        progress_percentage: true,
        enrolled_at: true,
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: { enrolled_at: 'desc' },
    });
  }

  /**
   * Get enrollment stats for a course (Instructor/Admin)
   */
  public static async getCourseEnrollmentStats(courseId: string, userId: string, role: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, instructor_id: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (role !== 'ADMIN' && course.instructor_id !== userId) {
      throw new Error('Forbidden: You are not the instructor of this course');
    }

    const totalEnrollments = await prisma.enrollment.count({
      where: { course_id: courseId },
    });

    // We can expand stats here in the future
    return {
      course_id: courseId,
      total_enrollments: totalEnrollments,
    };
  }
}
