import { PrismaClient, EnrollmentStatus } from "@prisma/client";
import { SEED_VOLUMES, FRONTEND_COURSE_TITLE, FRONTEND_COHORT_STUDENTS } from "./helpers/constants";
import { getProgressPercentage, randomDateWithinLastDays } from "./helpers/random";

export interface EnrollmentSeedResult {
  enrollmentIds: string[];
  enrollmentsByStudent: Record<string, { course_id: string; enrollment_id: string }[]>;
}

export async function seedEnrollments(
  prisma: PrismaClient,
  studentIds: string[],
  courseIds: string[],
  courseIdMap: Record<string, string>
): Promise<EnrollmentSeedResult> {
  console.log(`\n🎓 [Stage 7] Batched Seeding of ~${SEED_VOLUMES.ENROLLMENTS_COUNT} Realistic Enrollments...`);

  // Define popularity weights to create realistic top popular ranking (AI -> Node.js -> Java -> React -> Flutter...)
  const targetCounts: Record<string, number> = {
    "Artificial Intelligence & Deep Learning Engineer": 140,
    "Back-End (Node.js & Express) Diploma": 125,
    "Java Back-End & Spring Boot Enterprise Architecture": 110,
    "Front-End Development (React.js & Tailwind CSS)": 95,
    "Flutter Mobile Application Masterclass (iOS & Android)": 85,
    "PHP Laravel Enterprise Application Development": 70,
    "Data Analysis & Business Intelligence Bootcamp": 65,
    "UI/UX Design Masterclass (Figma & UX Architecture)": 50,
    ".NET Core Back-End Developer Roadmap": 35,
    "Programming Fundamentals & Problem Solving": 25,
  };

  const enrollmentPayload: Array<{
    student_id: string;
    course_id: string;
    progress_percentage: number;
    status: EnrollmentStatus;
    enrolled_at: Date;
    completed_at: Date | null;
  }> = [];

  const usedPairs = new Set<string>();

  for (const [courseTitle, desiredCount] of Object.entries(targetCounts)) {
    const courseId = courseIdMap[courseTitle];
    if (!courseId) continue;

    for (let i = 0; i < Math.min(desiredCount, studentIds.length); i++) {
      const studentId = studentIds[i % studentIds.length];
      const pairKey = `${studentId}_${courseId}`;

      if (!usedPairs.has(pairKey)) {
        usedPairs.add(pairKey);
        const progress = getProgressPercentage(i + usedPairs.size);
        const enrolledAt = randomDateWithinLastDays(90, i);
        const completedAt = progress === 100.0 ? randomDateWithinLastDays(10, i) : null;

        enrollmentPayload.push({
          student_id: studentId,
          course_id: courseId,
          progress_percentage: progress,
          status: EnrollmentStatus.ACTIVE,
          enrolled_at: enrolledAt,
          completed_at: completedAt,
        });
      }
    }
  }

  // Ensure we reach target ENROLLMENTS_COUNT by filling leftover combinations if needed
  let stuIndex = 0;
  let crsIndex = 0;
  while (enrollmentPayload.length < SEED_VOLUMES.ENROLLMENTS_COUNT && stuIndex < studentIds.length * courseIds.length) {
    const sId = studentIds[stuIndex % studentIds.length];
    const cId = courseIds[crsIndex % courseIds.length];
    const pair = `${sId}_${cId}`;

    if (!usedPairs.has(pair)) {
      usedPairs.add(pair);
      const prog = getProgressPercentage(enrollmentPayload.length);
      enrollmentPayload.push({
        student_id: sId,
        course_id: cId,
        progress_percentage: prog,
        status: EnrollmentStatus.ACTIVE,
        enrolled_at: randomDateWithinLastDays(60, enrollmentPayload.length),
        completed_at: prog === 100 ? new Date() : null,
      });
    }
    stuIndex++;
    if (stuIndex % studentIds.length === 0) crsIndex++;
  }

  // Batched insert skipping unique constraint duplicates
  await prisma.enrollment.createMany({
    data: enrollmentPayload,
    skipDuplicates: true,
  });

  // Explicitly verify active enrollments for the Front-End interactive cohort test students
  const frontendCourseId = courseIdMap[FRONTEND_COURSE_TITLE];
  if (frontendCourseId) {
    const testUsers = await prisma.user.findMany({
      where: { email: { in: FRONTEND_COHORT_STUDENTS.map((s) => s.email) } },
      select: { id: true },
    });
    for (const u of testUsers) {
      await prisma.enrollment.upsert({
        where: { student_id_course_id: { student_id: u.id, course_id: frontendCourseId } },
        update: { status: EnrollmentStatus.ACTIVE },
        create: {
          student_id: u.id,
          course_id: frontendCourseId,
          progress_percentage: 0.0,
          status: EnrollmentStatus.ACTIVE,
          enrolled_at: new Date(),
        },
      });
    }
  }

  const allEnrollments = await prisma.enrollment.findMany({
    select: { id: true, student_id: true, course_id: true, progress_percentage: true },
  });

  const enrollmentsByStudent: Record<string, { course_id: string; enrollment_id: string }[]> = {};
  for (const enr of allEnrollments) {
    if (!enrollmentsByStudent[enr.student_id]) {
      enrollmentsByStudent[enr.student_id] = [];
    }
    enrollmentsByStudent[enr.student_id].push({ course_id: enr.course_id, enrollment_id: enr.id });
  }

  console.log(`✅ Verified ${allEnrollments.length} Course Enrollments across the platform.`);
  return { enrollmentIds: allEnrollments.map((e) => e.id), enrollmentsByStudent };
}
