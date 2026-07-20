import { PrismaClient } from '@prisma/client';
import { CourseUtil } from '../utils/course.util';
const prisma = new PrismaClient();

export class LessonService {
  /**
   * Create a new lesson
   */
  public static async createLesson(
    courseId: string,
    sectionId: string,
    userId: string,
    role: string,
    data: { title: string; duration: number; video_url?: string; is_free_preview?: boolean; sequence_order?: number }
  ) {
    // 1. Verify course ownership
    await CourseUtil.verifyCourseOwnership(courseId, userId, role);

    // 2. Verify section exists and belongs to the course
    await CourseUtil.verifySectionExists(sectionId, courseId);

    // 3. Reject duplicate titles within the same section (case-insensitive)
    const trimmedTitle = data.title.trim();
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        section_id: sectionId,
        title: {
          equals: trimmedTitle,
          mode: 'insensitive',
        },
      },
    });

    if (existingLesson) {
      throw new Error('A lesson with this title already exists in the section');
    }

    // 4. Sequence Ordering Algorithm inside a Transaction
    return prisma.$transaction(async (tx) => {
      // IMPORTANT: Acquire exclusive row-level lock on the Section BEFORE any other queries.
      // This forces concurrent lesson updates for the same section to run sequentially,
      // entirely eliminating Write Skew anomalies (duplicate sequence_order values).
      // DO NOT REMOVE THIS LOCK.
      await tx.$executeRaw`SELECT id FROM "Section" WHERE id = ${sectionId} FOR UPDATE`;

      // Find the current max sequence_order
      const maxOrderResult = await tx.lesson.aggregate({
        where: { section_id: sectionId },
        _max: { sequence_order: true },
      });
      const maxOrder = maxOrderResult._max.sequence_order || 0;

      let finalSequenceOrder = maxOrder + 1; // Default to MAX + 1

      if (data.sequence_order !== undefined) {
        finalSequenceOrder = data.sequence_order;

        // If the provided order is less than or equal to current max, we need to shift existing ones
        if (finalSequenceOrder <= maxOrder) {
          await tx.lesson.updateMany({
            where: {
              section_id: sectionId,
              sequence_order: { gte: finalSequenceOrder },
            },
            data: {
              sequence_order: { increment: 1 },
            },
          });
        }
      }

      // 5. Create the lesson
      const newLesson = await tx.lesson.create({
        data: {
          section_id: sectionId,
          title: trimmedTitle,
          duration: data.duration,
          video_url: data.video_url || null,
          is_free_preview: data.is_free_preview || false,
          sequence_order: finalSequenceOrder,
        },
      });

      return newLesson;
    }, { maxWait: 10000, timeout: 20000 });
  }

  /**
   * Update a lesson
   */
  public static async updateLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
    userId: string,
    role: string,
    data: { title?: string; duration?: number; video_url?: string; is_free_preview?: boolean; sequence_order?: number }
  ) {
    // 1. Verify lesson exists and belongs to section
    const lesson = await this.verifyLessonExists(lessonId, sectionId);

    // 2. Verify section exists and belongs to the course
    await CourseUtil.verifySectionExists(sectionId, courseId);

    // 3. Verify course ownership
    await CourseUtil.verifyCourseOwnership(courseId, userId, role);

    // 4. Duplicate title check
    let trimmedTitle: string | undefined = undefined;
    if (data.title) {
      trimmedTitle = data.title.trim();
      const existingLesson = await prisma.lesson.findFirst({
        where: {
          section_id: sectionId,
          title: {
            equals: trimmedTitle,
            mode: 'insensitive',
          },
          id: { not: lessonId },
        },
      });

      if (existingLesson) {
        throw new Error('A lesson with this title already exists in the section');
      }
    }

    // 5. Update inside transaction
    return prisma.$transaction(async (tx) => {
      // IMPORTANT: Acquire exclusive row-level lock on the Section BEFORE any other queries.
      // This forces concurrent lesson updates for the same section to run sequentially,
      // entirely eliminating Write Skew anomalies (duplicate sequence_order values).
      // DO NOT REMOVE THIS LOCK.
      await tx.$executeRaw`SELECT id FROM "Section" WHERE id = ${sectionId} FOR UPDATE`;

      let finalSequenceOrder = lesson.sequence_order;

      if (data.sequence_order !== undefined && data.sequence_order !== lesson.sequence_order) {
        const oldOrder = lesson.sequence_order;
        const requestedOrder = data.sequence_order;

        const maxOrderResult = await tx.lesson.aggregate({
          where: { section_id: sectionId },
          _max: { sequence_order: true },
        });
        const maxOrder = maxOrderResult._max.sequence_order || 1;

        // Clamp final order
        finalSequenceOrder = Math.min(Math.max(1, requestedOrder), maxOrder);

        if (finalSequenceOrder < oldOrder) {
          // Shifting backwards: e.g. from 5 to 2. Shift items [2, 4] up by 1.
          await tx.lesson.updateMany({
            where: {
              section_id: sectionId,
              sequence_order: { gte: finalSequenceOrder, lt: oldOrder },
            },
            data: { sequence_order: { increment: 1 } },
          });
        } else if (finalSequenceOrder > oldOrder) {
          // Shifting forwards: e.g. from 2 to 5. Shift items [3, 5] down by 1.
          await tx.lesson.updateMany({
            where: {
              section_id: sectionId,
              sequence_order: { gt: oldOrder, lte: finalSequenceOrder },
            },
            data: { sequence_order: { decrement: 1 } },
          });
        }
      }

      // Update the target lesson
      const updatedLesson = await tx.lesson.update({
        where: { id: lessonId },
        data: {
          ...(trimmedTitle !== undefined && { title: trimmedTitle }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.video_url !== undefined && { video_url: data.video_url }),
          ...(data.is_free_preview !== undefined && { is_free_preview: data.is_free_preview }),
          ...(finalSequenceOrder !== lesson.sequence_order && { sequence_order: finalSequenceOrder }),
        },
        select: {
          id: true,
          section_id: true,
          title: true,
          duration: true,
          video_url: true,
          is_free_preview: true,
          sequence_order: true,
        },
      });

      return updatedLesson;
    }, { maxWait: 10000, timeout: 20000 });
  }

  /**
   * Delete a lesson
   */
  public static async deleteLesson(
    courseId: string,
    sectionId: string,
    lessonId: string,
    userId: string,
    role: string
  ) {
    // 1. Verify lesson exists and belongs to section
    const lesson = await this.verifyLessonExists(lessonId, sectionId);

    // 2. Verify section exists and belongs to the course
    await CourseUtil.verifySectionExists(sectionId, courseId);

    // 3. Verify course ownership
    await CourseUtil.verifyCourseOwnership(courseId, userId, role);

    // 4. Delete inside transaction
    return prisma.$transaction(async (tx) => {
      // IMPORTANT: Acquire exclusive row-level lock on the Section BEFORE any other queries.
      // This forces concurrent lesson updates/deletes for the same section to run sequentially.
      await tx.$executeRaw`SELECT id FROM "Section" WHERE id = ${sectionId} FOR UPDATE`;

      const deletedOrder = lesson.sequence_order;

      // Delete the lesson
      await tx.lesson.delete({
        where: { id: lessonId },
      });

      // Shift every lesson after it
      await tx.lesson.updateMany({
        where: {
          section_id: sectionId,
          sequence_order: { gt: deletedOrder },
        },
        data: {
          sequence_order: { decrement: 1 },
        },
      });
    }, { maxWait: 10000, timeout: 20000 });
  }

  // --- Private Helpers ---

  private static async verifyLessonExists(lessonId: string, sectionId: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.section_id !== sectionId) {
      throw new Error('Lesson not found');
    }

    return lesson;
  }
}
