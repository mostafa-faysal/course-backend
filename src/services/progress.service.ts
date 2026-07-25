import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ProgressTrackingService {
  /**
   * Recalculates enrollment progress based strictly on completed lessons.
   * Runs within a transaction with a row-level lock on Enrollment.
   */
  public static async recalculateEnrollmentProgress(tx: Prisma.TransactionClient, enrollmentId: string, courseId: string) {
    // 1. Lock the enrollment to prevent Write Skew
    await tx.$executeRaw`SELECT id FROM "Enrollment" WHERE id = ${enrollmentId} FOR UPDATE`;

    // 2. Get total lessons for the course
    const totalLessons = await tx.lesson.count({
      where: { section: { course_id: courseId } },
    });

    // 3. Get completed lessons for this enrollment
    const completedLessons = await tx.lessonProgress.count({
      where: {
        enrollment_id: enrollmentId,
        is_completed: true,
      },
    });

    // 4. Calculate exact percentage rounded to 2 decimal places
    let percentage = 0.0;
    if (totalLessons > 0) {
      percentage = Math.round((completedLessons / totalLessons) * 100 * 100) / 100;
    }

    // 5. Determine completion
    const isFinished = totalLessons > 0 && completedLessons === totalLessons;
    const completedAt = isFinished ? new Date() : null;

    // 6. Update the enrollment
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress_percentage: percentage,
        completed_at: completedAt,
      },
    });

    return percentage;
  }

  /**
   * Mark a lesson as complete
   */
  public static async markLessonComplete(studentId: string, courseId: string, lessonId: string) {
    // 1. Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
    });

    if (!enrollment) {
      throw new Error('Forbidden: Not enrolled in this course');
    }

    // 2. Check if lesson belongs to course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: true },
    });
    if (!lesson || lesson.section.course_id !== courseId) {
      throw new Error('Lesson not found in this course');
    }

    // 3. Transaction
    return prisma.$transaction(async (tx) => {
      // Upsert LessonProgress
      await tx.lessonProgress.upsert({
        where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
        update: {
          is_completed: true,
          completed_at: new Date(),
        },
        create: {
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          is_completed: true,
          completed_at: new Date(),
        },
      });

      // Recalculate
      const newPercentage = await ProgressTrackingService.recalculateEnrollmentProgress(tx, enrollment.id, courseId);
      return newPercentage;
    }, { maxWait: 10000, timeout: 15000 });
  }

  /**
   * Mark a lesson as incomplete
   */
  public static async markLessonIncomplete(studentId: string, courseId: string, lessonId: string) {
    // 1. Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
    });

    if (!enrollment) {
      throw new Error('Forbidden: Not enrolled in this course');
    }

    // 2. Transaction
    return prisma.$transaction(async (tx) => {
      // Update LessonProgress (do NOT delete, to preserve watch_position and analytics)
      await tx.lessonProgress.updateMany({
        where: { enrollment_id: enrollment.id, lesson_id: lessonId },
        data: {
          is_completed: false,
          completed_at: null,
        },
      });

      // Recalculate
      const newPercentage = await ProgressTrackingService.recalculateEnrollmentProgress(tx, enrollment.id, courseId);
      return newPercentage;
    }, { maxWait: 10000, timeout: 15000 });
  }

  /**
   * Update watch position
   */
  public static async updateWatchPosition(studentId: string, courseId: string, lessonId: string, position: number) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
    });

    if (!enrollment) {
      throw new Error('Forbidden: Not enrolled in this course');
    }

    // Transaction to update watch position and last watched lesson
    await prisma.$transaction(async (tx) => {
      await tx.lessonProgress.upsert({
        where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
        update: {
          watch_position_seconds: position,
          last_watched_at: new Date(),
        },
        create: {
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          watch_position_seconds: position,
          last_watched_at: new Date(),
        },
      });

      await tx.courseProgress.upsert({
        where: { enrollment_id: enrollment.id },
        update: { last_watched_lesson_id: lessonId },
        create: {
          enrollment_id: enrollment.id,
          last_watched_lesson_id: lessonId,
        },
      });

      const lesson = await tx.lesson.findUnique({ where: { id: lessonId } });
      if (lesson && position >= lesson.duration * 0.95) {
        // Auto-complete lesson
        const existingProgress = await tx.lessonProgress.findUnique({
          where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } }
        });
        
        if (!existingProgress?.is_completed) {
          await tx.lessonProgress.update({
            where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: lessonId } },
            data: {
              is_completed: true,
              completed_at: new Date()
            }
          });
          await ProgressTrackingService.recalculateEnrollmentProgress(tx, enrollment.id, courseId);
        }
      }
    }, { maxWait: 10000, timeout: 15000 });

    return { status: 'success' };
  }

  /**
   * Get Course Progress
   */
  public static async getCourseProgress(studentId: string, courseId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { student_id_course_id: { student_id: studentId, course_id: courseId } },
      include: {
        course_progress: true,
        lesson_progress: {
          where: { is_completed: true },
          select: { lesson_id: true }
        }
      }
    });

    if (!enrollment) {
      throw new Error('Forbidden: Not enrolled in this course');
    }

    const totalLessons = await prisma.lesson.count({
      where: { section: { course_id: courseId } }
    });

    const completedLessonIds = enrollment.lesson_progress.map(lp => lp.lesson_id);
    const completedCount = completedLessonIds.length;
    const remainingCount = totalLessons - completedCount;

    return {
      total_lessons: totalLessons,
      completed_lessons: completedCount,
      remaining_lessons: remainingCount,
      progress_percentage: enrollment.progress_percentage,
      completed_at: enrollment.completed_at,
      last_watched_lesson_id: enrollment.course_progress?.last_watched_lesson_id || null,
      completed_lesson_ids: completedLessonIds
    };
  }
}
