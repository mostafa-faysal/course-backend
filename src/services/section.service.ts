import { PrismaClient } from '@prisma/client';
import { CourseUtil } from '../utils/course.util';
const prisma = new PrismaClient();

export class SectionService {
  /**
   * Create a new section
   */
  public static async createSection(
    courseId: string,
    userId: string,
    role: string,
    data: { title: string; sequence_order?: number }
  ) {
    // 1. Verify course ownership
    await CourseUtil.verifyCourseOwnership(courseId, userId, role);

    // 2. Reject duplicate titles within the same course (case-insensitive)
    const trimmedTitle = data.title.trim();
    const existingSection = await prisma.section.findFirst({
      where: {
        course_id: courseId,
        title: {
          equals: trimmedTitle,
          mode: 'insensitive',
        },
      },
    });

    if (existingSection) {
      throw new Error('A section with this title already exists in the course');
    }

    // 4. Sequence Ordering Algorithm inside a Transaction
    return prisma.$transaction(async (tx) => {
      // IMPORTANT: Acquire exclusive row-level lock on the Course BEFORE any other queries.
      // This forces concurrent section updates for the same course to run sequentially,
      // entirely eliminating Write Skew anomalies (duplicate sequence_order values).
      // DO NOT REMOVE THIS LOCK.
      await tx.$executeRaw`SELECT id FROM "Course" WHERE id = ${courseId} FOR UPDATE`;

      // Find the current max sequence_order
      const maxOrderResult = await tx.section.aggregate({
        where: { course_id: courseId },
        _max: { sequence_order: true },
      });
      const maxOrder = maxOrderResult._max.sequence_order || 0;

      let finalSequenceOrder = maxOrder + 1; // Default to MAX + 1

      if (data.sequence_order !== undefined) {
        finalSequenceOrder = data.sequence_order;

        // If the provided order is less than or equal to current max, we need to shift existing ones
        if (finalSequenceOrder <= maxOrder) {
          await tx.section.updateMany({
            where: {
              course_id: courseId,
              sequence_order: { gte: finalSequenceOrder },
            },
            data: {
              sequence_order: { increment: 1 },
            },
          });
        }
      }

      // 5. Create the section
      const newSection = await tx.section.create({
        data: {
          course_id: courseId,
          title: trimmedTitle,
          sequence_order: finalSequenceOrder,
        },
        select: {
          id: true,
          course_id: true,
          title: true,
          sequence_order: true,
        },
      });

      return newSection;
    });
  }

  /**
   * Update a section
   */
  public static async updateSection(
    courseId: string,
    sectionId: string,
    userId: string,
    role: string,
    data: { title?: string; sequence_order?: number }
  ) {
    // 1. Verify section exists
    const section = await CourseUtil.verifySectionExists(sectionId, courseId);

    // 2. Verify course and ownership
    await CourseUtil.verifyCourseOwnership(courseId, userId, role);

    // 3. Duplicate title check
    let trimmedTitle: string | undefined = undefined;
    if (data.title) {
      trimmedTitle = data.title.trim();
      const existingSection = await prisma.section.findFirst({
        where: {
          course_id: courseId,
          title: {
            equals: trimmedTitle,
            mode: 'insensitive',
          },
          id: { not: sectionId },
        },
      });

      if (existingSection) {
        throw new Error('A section with this title already exists in the course');
      }
    }

    // 4. Update inside transaction
    return prisma.$transaction(async (tx) => {
      // IMPORTANT: Acquire exclusive row-level lock on the Course BEFORE any other queries.
      // This forces concurrent section updates for the same course to run sequentially,
      // entirely eliminating Write Skew anomalies (duplicate sequence_order values).
      // DO NOT REMOVE THIS LOCK.
      await tx.$executeRaw`SELECT id FROM "Course" WHERE id = ${courseId} FOR UPDATE`;

      let finalSequenceOrder = section.sequence_order;

      if (data.sequence_order !== undefined && data.sequence_order !== section.sequence_order) {
        const oldOrder = section.sequence_order;
        const requestedOrder = data.sequence_order;

        const maxOrderResult = await tx.section.aggregate({
          where: { course_id: courseId },
          _max: { sequence_order: true },
        });
        const maxOrder = maxOrderResult._max.sequence_order || 1;

        // Clamp final order
        finalSequenceOrder = Math.min(Math.max(1, requestedOrder), maxOrder);

        if (finalSequenceOrder < oldOrder) {
          // Shifting backwards: e.g. from 5 to 2. Shift items [2, 4] up by 1.
          await tx.section.updateMany({
            where: {
              course_id: courseId,
              sequence_order: { gte: finalSequenceOrder, lt: oldOrder },
            },
            data: { sequence_order: { increment: 1 } },
          });
        } else if (finalSequenceOrder > oldOrder) {
          // Shifting forwards: e.g. from 2 to 5. Shift items [3, 5] down by 1.
          await tx.section.updateMany({
            where: {
              course_id: courseId,
              sequence_order: { gt: oldOrder, lte: finalSequenceOrder },
            },
            data: { sequence_order: { decrement: 1 } },
          });
        }
      }

      // Update the target section
      const updatedSection = await tx.section.update({
        where: { id: sectionId },
        data: {
          ...(trimmedTitle !== undefined && { title: trimmedTitle }),
          ...(finalSequenceOrder !== section.sequence_order && { sequence_order: finalSequenceOrder }),
        },
        select: {
          id: true,
          course_id: true,
          title: true,
          sequence_order: true,
        },
      });

      return updatedSection;
    }, { maxWait: 10000, timeout: 20000 });
  }

  /**
   * Delete a section
   */
  public static async deleteSection(
    courseId: string,
    sectionId: string,
    userId: string,
    role: string
  ) {
    // 1. Verify section exists
    const section = await CourseUtil.verifySectionExists(sectionId, courseId);

    // 2. Verify course and ownership
    await CourseUtil.verifyCourseOwnership(courseId, userId, role);

    // 3. Delete inside transaction
    return prisma.$transaction(async (tx) => {
      // IMPORTANT: Acquire exclusive row-level lock on the Course BEFORE any other queries.
      // This forces concurrent section updates for the same course to run sequentially,
      // entirely eliminating Write Skew anomalies (duplicate sequence_order values).
      // DO NOT REMOVE THIS LOCK.
      await tx.$executeRaw`SELECT id FROM "Course" WHERE id = ${courseId} FOR UPDATE`;

      const deletedOrder = section.sequence_order;

      // 4. Handle Lessons Cleanup (Since schema does not have onDelete: Cascade)
      const lessons = await tx.lesson.findMany({
        where: { section_id: sectionId },
        select: { id: true },
      });
      const lessonIds = lessons.map((l) => l.id);

      if (lessonIds.length > 0) {
        // Nullify last_watched_lesson_id in CourseProgress
        await tx.courseProgress.updateMany({
          where: { last_watched_lesson_id: { in: lessonIds } },
          data: { last_watched_lesson_id: null },
        });

        // Delete LessonProgress
        await tx.lessonProgress.deleteMany({
          where: { lesson_id: { in: lessonIds } },
        });

        // Delete Lessons
        await tx.lesson.deleteMany({
          where: { section_id: sectionId },
        });
      }

      // 5. Delete the section
      await tx.section.delete({
        where: { id: sectionId },
      });

      // 6. Shift remaining sections backward to close the gap
      await tx.section.updateMany({
        where: {
          course_id: courseId,
          sequence_order: { gt: deletedOrder },
        },
        data: {
          sequence_order: { decrement: 1 },
        },
      });
    }, { maxWait: 10000, timeout: 20000 });
  }

}
