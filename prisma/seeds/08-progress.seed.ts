import { PrismaClient } from "@prisma/client";
import { pick, randomDateWithinLastDays } from "./helpers/random";
import { FRONTEND_COURSE_TITLE, FRONTEND_COHORT_STUDENTS } from "./helpers/constants";

export async function seedProgress(
  prisma: PrismaClient,
  enrollmentIds: string[],
  lessonIds: string[],
  courseIdMap: Record<string, string> = {}
): Promise<void> {
  console.log("\n⚡ [Stage 8] Batched Seeding of Course & Lesson Progress (Continue Learning)...");

  if (lessonIds.length === 0 || enrollmentIds.length === 0) {
    console.warn("⚠️ Skipping Progress seed: No enrollments or lessons available.");
    return;
  }

  // 1. Explicitly seed realistic progress for the Front-End interactive cohort students
  const frontendCourseId = courseIdMap[FRONTEND_COURSE_TITLE];
  const frontendLesson = frontendCourseId
    ? await prisma.lesson.findFirst({
        where: { section: { course_id: frontendCourseId }, sequence_order: 1 },
      })
    : null;

  if (frontendCourseId && frontendLesson) {
    const testUsers = await prisma.user.findMany({
      where: { email: { in: FRONTEND_COHORT_STUDENTS.map((s) => s.email) } },
      select: { id: true, email: true },
    });

    for (let i = 0; i < testUsers.length; i++) {
      const user = testUsers[i];
      const enrollment = await prisma.enrollment.findUnique({
        where: { student_id_course_id: { student_id: user.id, course_id: frontendCourseId } },
      });

      if (enrollment) {
        if (i === 0) {
          // Student 1: Currently watching Lecture 1 (Continue Watching demo)
          await prisma.courseProgress.upsert({
            where: { enrollment_id: enrollment.id },
            update: { last_watched_lesson_id: frontendLesson.id, last_watched_at: new Date() },
            create: { enrollment_id: enrollment.id, last_watched_lesson_id: frontendLesson.id, last_watched_at: new Date() },
          });
          await prisma.lessonProgress.upsert({
            where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: frontendLesson.id } },
            update: { is_completed: false, watch_position_seconds: 900, last_watched_at: new Date() },
            create: {
              enrollment_id: enrollment.id,
              lesson_id: frontendLesson.id,
              is_completed: false,
              watch_position_seconds: 900,
              last_watched_at: new Date(),
            },
          });
        } else if (i === 1) {
          // Student 2: Finished Lecture 1 (waiting for Lecture 2 upload by instructor)
          await prisma.lessonProgress.upsert({
            where: { enrollment_id_lesson_id: { enrollment_id: enrollment.id, lesson_id: frontendLesson.id } },
            update: { is_completed: true, watch_position_seconds: 3900, completed_at: new Date(), last_watched_at: new Date() },
            create: {
              enrollment_id: enrollment.id,
              lesson_id: frontendLesson.id,
              is_completed: true,
              watch_position_seconds: 3900,
              completed_at: new Date(),
              last_watched_at: new Date(),
            },
          });
          await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: { progress_percentage: 100.0 },
          });
        }
        // Students 3, 4, 5 begin at 0% progress (newly enrolled & paid)
      }
    }
  }

  // 2. Filter out FrontEnd enrollments & lesson to prevent cross-course data mixing in random sampling
  const nonFrontendEnrollments = frontendCourseId
    ? await prisma.enrollment
        .findMany({
          where: { id: { in: enrollmentIds }, course_id: { not: frontendCourseId } },
          select: { id: true },
        })
        .then((res) => res.map((r) => r.id))
    : enrollmentIds;

  const generalLessonIds = frontendLesson ? lessonIds.filter((id) => id !== frontendLesson.id) : lessonIds;
  if (generalLessonIds.length === 0 || nonFrontendEnrollments.length === 0) return;

  // Pick top 300 active enrollments to inject vibrant Continue Learning progress data
  const sampleEnrollmentIds = nonFrontendEnrollments.slice(0, 300);

  const courseProgressPayload = sampleEnrollmentIds.map((eId, idx) => ({
    enrollment_id: eId,
    last_watched_lesson_id: pick(generalLessonIds, idx),
    last_watched_at: randomDateWithinLastDays(5, idx),
  }));

  await prisma.courseProgress.createMany({
    data: courseProgressPayload,
    skipDuplicates: true,
  });

  const lessonProgressPayload: Array<{
    enrollment_id: string;
    lesson_id: string;
    is_completed: boolean;
    watch_position_seconds: number;
    completed_at: Date | null;
    last_watched_at: Date;
  }> = [];

  for (let i = 0; i < sampleEnrollmentIds.length; i++) {
    const eId = sampleEnrollmentIds[i];
    for (let j = 0; j < Math.min(3, generalLessonIds.length); j++) {
      const lId = pick(generalLessonIds, i * 3 + j);
      const isCompleted = j === 0 || j === 1;
      lessonProgressPayload.push({
        enrollment_id: eId,
        lesson_id: lId,
        is_completed: isCompleted,
        watch_position_seconds: isCompleted ? 1800 : 450,
        completed_at: isCompleted ? randomDateWithinLastDays(7, i) : null,
        last_watched_at: randomDateWithinLastDays(2, i + j),
      });
    }
  }

  await prisma.lessonProgress.createMany({
    data: lessonProgressPayload,
    skipDuplicates: true,
  });

  console.log(`✅ Verified Course Progress & ${lessonProgressPayload.length} Lesson Progress records.`);
}

