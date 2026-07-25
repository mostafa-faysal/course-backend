import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LearningPlanService {
  /**
   * Ensure student has a Learning Plan. Uses upsert to prevent race conditions.
   */
  private static async getOrCreatePlan(studentId: string) {
    return await prisma.learningPlan.upsert({
      where: { student_id: studentId },
      update: {},
      create: { student_id: studentId },
    });
  }

  public static async getLearningPlan(studentId: string) {
    const plan = await this.getOrCreatePlan(studentId);

    const items = await prisma.learningPlanItem.findMany({
      where: { learning_plan_id: plan.id },
      orderBy: { sequence_order: 'asc' },
      select: {
        id: true,
        course_id: true,
        course: {
          select: {
            title: true,
            thumbnail: true,
            status: true,
            instructor: { select: { id: true, full_name: true } },
            category: { select: { id: true, name: true } }
          }
        }
      }
    });

    if (items.length === 0) {
      return {
        summary: { totalCourses: 0, enrolledCourses: 0, completedCourses: 0, inProgressCourses: 0, notStartedCourses: 0, overallProgress: 0 },
        items: []
      };
    }

    const courseIds = items.map(i => i.course_id);

    // Fetch enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId, course_id: { in: courseIds } },
      select: { course_id: true, progress_percentage: true, completed_at: true }
    });
    const enrollmentsMap = new Map(enrollments.map(e => [e.course_id, e]));

    // Fetch total lessons & duration per course
    const lessons = await prisma.lesson.findMany({
      where: { section: { course_id: { in: courseIds } } },
      select: { id: true, duration: true, section: { select: { course_id: true } } }
    });
    
    const courseStats = new Map<string, { totalLessons: number, duration: number }>();
    courseIds.forEach(id => courseStats.set(id, { totalLessons: 0, duration: 0 }));
    
    lessons.forEach(l => {
      const stats = courseStats.get(l.section.course_id)!;
      stats.totalLessons += 1;
      stats.duration += l.duration;
    });

    // Fetch completed lessons from LessonProgress
    const completedLessons = await prisma.lessonProgress.groupBy({
      by: ['enrollment_id'],
      where: {
        enrollment: { student_id: studentId, course_id: { in: courseIds } },
        is_completed: true
      },
      _count: { lesson_id: true }
    });

    const completedLessonsMap = new Map<string, number>();
    for (const cl of completedLessons) {
      // Find which course this enrollment belongs to
      const enroll = enrollments.find(e => {
        // We don't have enrollment id here easily mapped without another query, wait!
        // We can just fetch LessonProgress directly joined with enrollment.course_id
        return false;
      });
    }

    // Better way to count completed lessons per course:
    const lessonProgressRecords = await prisma.lessonProgress.findMany({
      where: {
        enrollment: { student_id: studentId, course_id: { in: courseIds } },
        is_completed: true
      },
      select: { enrollment: { select: { course_id: true } } }
    });
    
    const completedLessonsPerCourse = new Map<string, number>();
    lessonProgressRecords.forEach(lp => {
      const cid = lp.enrollment.course_id;
      completedLessonsPerCourse.set(cid, (completedLessonsPerCourse.get(cid) || 0) + 1);
    });

    let enrolledCourses = 0, completedCourses = 0, inProgressCourses = 0, notStartedCourses = 0, totalProgressSum = 0;

    const formattedItems = items.map(item => {
      const cid = item.course_id;
      const enrollment = enrollmentsMap.get(cid);
      const stats = courseStats.get(cid)!;
      const compLessons = completedLessonsPerCourse.get(cid) || 0;
      
      const enrolled = !!enrollment;
      const progress = enrollment?.progress_percentage || 0;
      
      let courseStatus = 'NOT_STARTED';
      if (enrolled) {
        enrolledCourses++;
        totalProgressSum += progress;
        if (enrollment.completed_at || progress === 100) {
          courseStatus = 'COMPLETED';
          completedCourses++;
        } else if (progress > 0 || compLessons > 0) {
          courseStatus = 'IN_PROGRESS';
          inProgressCourses++;
        } else {
          notStartedCourses++;
        }
      } else {
        notStartedCourses++;
      }

      return {
        id: cid,
        title: item.course.title,
        thumbnail: item.course.thumbnail,
        instructor: item.course.instructor,
        category: item.course.category,
        enrolled,
        progress,
        completedLessons: compLessons,
        totalLessons: stats.totalLessons,
        estimatedDuration: stats.duration,
        courseStatus,
        isAvailable: item.course.status === 'PUBLISHED'
      };
    });

    const summary = {
      totalCourses: items.length,
      enrolledCourses,
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      overallProgress: enrolledCourses > 0 ? parseFloat((totalProgressSum / enrolledCourses).toFixed(2)) : 0
    };

    return { summary, items: formattedItems };
  }

  public static async addCourse(studentId: string, courseId: string) {
    return await prisma.$transaction(async (tx) => {
      const plan = await tx.learningPlan.upsert({
        where: { student_id: studentId },
        update: {},
        create: { student_id: studentId },
      });

      const course = await tx.course.findUnique({ where: { id: courseId }, select: { status: true } });
      if (!course) throw new Error('Not Found: Course does not exist');
      if (course.status !== 'PUBLISHED') throw new Error('Bad Request: Course is not published');

      const existing = await tx.learningPlanItem.findUnique({
        where: { learning_plan_id_course_id: { learning_plan_id: plan.id, course_id: courseId } }
      });
      if (existing) throw new Error('Conflict: Course already in Learning Plan');

      const maxSeq = await tx.learningPlanItem.aggregate({
        where: { learning_plan_id: plan.id },
        _max: { sequence_order: true }
      });

      const nextSeq = (maxSeq._max.sequence_order || 0) + 1;

      return await tx.learningPlanItem.create({
        data: {
          learning_plan_id: plan.id,
          course_id: courseId,
          sequence_order: nextSeq
        }
      });
    });
  }

  public static async removeCourse(studentId: string, courseId: string) {
    return await prisma.$transaction(async (tx) => {
      const plan = await tx.learningPlan.findUnique({ where: { student_id: studentId } });
      if (!plan) throw new Error('Not Found: Learning Plan does not exist');

      const item = await tx.learningPlanItem.findUnique({
        where: { learning_plan_id_course_id: { learning_plan_id: plan.id, course_id: courseId } }
      });
      if (!item) throw new Error('Not Found: Course is not in Learning Plan');

      await tx.learningPlanItem.delete({ where: { id: item.id } });

      // Normalization
      const remainingItems = await tx.learningPlanItem.findMany({
        where: { learning_plan_id: plan.id },
        orderBy: { sequence_order: 'asc' },
        select: { id: true }
      });

      // To avoid unique constraint violations during normalization, we shift to negative first.
      for (let i = 0; i < remainingItems.length; i++) {
        await tx.learningPlanItem.update({
          where: { id: remainingItems[i].id },
          data: { sequence_order: -(i + 1000) }
        });
      }
      for (let i = 0; i < remainingItems.length; i++) {
        await tx.learningPlanItem.update({
          where: { id: remainingItems[i].id },
          data: { sequence_order: i + 1 }
        });
      }
      
      return { success: true };
    });
  }

  public static async reorderCourses(studentId: string, orderedCourseIds: string[]) {
    return await prisma.$transaction(async (tx) => {
      const plan = await tx.learningPlan.findUnique({ where: { student_id: studentId } });
      if (!plan) throw new Error('Not Found: Learning Plan does not exist');

      const currentItems = await tx.learningPlanItem.findMany({
        where: { learning_plan_id: plan.id },
        select: { id: true, course_id: true }
      });

      if (currentItems.length !== orderedCourseIds.length) {
        throw new Error('Bad Request: Array length does not match Learning Plan size');
      }

      const currentCourseIds = new Set(currentItems.map(i => i.course_id));
      for (const cid of orderedCourseIds) {
        if (!currentCourseIds.has(cid)) {
          throw new Error('Bad Request: Course ID not in Learning Plan (Foreign or missing ID)');
        }
      }

      const itemMap = new Map(currentItems.map(i => [i.course_id, i.id]));

      // Step 1: Assign temporary negative orders
      for (let i = 0; i < orderedCourseIds.length; i++) {
        const itemId = itemMap.get(orderedCourseIds[i])!;
        await tx.learningPlanItem.update({
          where: { id: itemId },
          data: { sequence_order: -(i + 1000) }
        });
      }

      // Step 2: Assign final positive orders
      for (let i = 0; i < orderedCourseIds.length; i++) {
        const itemId = itemMap.get(orderedCourseIds[i])!;
        await tx.learningPlanItem.update({
          where: { id: itemId },
          data: { sequence_order: i + 1 }
        });
      }

      return { success: true };
    });
  }

  public static async getRecommendations(studentId: string) {
    const plan = await this.getOrCreatePlan(studentId);

    const planItems = await prisma.learningPlanItem.findMany({
      where: { learning_plan_id: plan.id },
      select: { course_id: true, course: { select: { category_id: true } } }
    });

    const planCourseIds = planItems.map(i => i.course_id);
    const planCategories = [...new Set(planItems.map(i => i.course.category_id))];

    const enrollments = await prisma.enrollment.findMany({
      where: { student_id: studentId },
      select: { course_id: true }
    });
    const enrolledCourseIds = enrollments.map(e => e.course_id);

    const excludeIds = [...planCourseIds, ...enrolledCourseIds];

    // Priority: Same categories, Published, highest enrollment count, newest
    // Since Prisma does not currently support ordering by aggregate functions easily in simple queries without previews,
    // and `orderBy: { enrollments: { _count: 'desc' } }` is standard in Prisma 5+, we'll use that.
    
    let recommendations = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: excludeIds },
        ...(planCategories.length > 0 ? { category_id: { in: planCategories } } : {})
      },
      orderBy: [
        { enrollments: { _count: 'desc' } },
        { created_at: 'desc' }
      ],
      take: 10,
      select: {
        id: true,
        title: true,
        thumbnail: true,
        price: true,
        instructor: { select: { id: true, full_name: true } },
        category: { select: { id: true, name: true } }
      }
    });

    // If we didn't find enough in the same categories, fetch globally
    if (recommendations.length < 10) {
      const foundIds = recommendations.map(r => r.id);
      const moreExcludeIds = [...excludeIds, ...foundIds];
      
      const moreRecommendations = await prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: moreExcludeIds }
        },
        orderBy: [
          { enrollments: { _count: 'desc' } },
          { created_at: 'desc' }
        ],
        take: 10 - recommendations.length,
        select: {
          id: true,
          title: true,
          thumbnail: true,
          price: true,
          instructor: { select: { id: true, full_name: true } },
          category: { select: { id: true, name: true } }
        }
      });
      
      recommendations = [...recommendations, ...moreRecommendations];
    }

    return recommendations;
  }
}
