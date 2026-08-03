import { PrismaClient, AssignmentStatus, SubmissionStatus } from "@prisma/client";
import { pick, randomDateWithinLastDays } from "./helpers/random";

export async function seedAssignments(
  prisma: PrismaClient,
  courseIds: string[],
  studentIds: string[],
  instructorMap: Record<string, string>
): Promise<void> {
  console.log(`\n📝 [Stage 17] Seeding Practical Capstone Assignments & Student Submissions...`);

  const assignmentIds: string[] = [];
  for (let i = 0; i < courseIds.length; i++) {
    const course_id = courseIds[i];
    const title = "المشروع العملي الختامي (Capstone Production Project)";

    let assignment = await prisma.assignment.findFirst({
      where: { course_id, title },
    });

    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          course_id,
          title,
          description: "قم بتنفيذ نظام برمجي متكامل يطبق معايير العمارة النظيفة Clean Architecture والأداء المرتفع مع إدراج رابط مستودع GitHub.",
          total_marks: 100.0,
          passing_marks: 75.0,
          status: AssignmentStatus.PUBLISHED,
        },
      });
    }
    assignmentIds.push(assignment.id);
  }

  // Seed sample student submissions idempotently
  const existingSubmissions = await prisma.assignmentSubmission.count();
  if (existingSubmissions < 100 && assignmentIds.length > 0 && studentIds.length > 0) {
    const instructorIds = Object.values(instructorMap);
    const submissionsPayload = [];

    for (let i = 0; i < 100; i++) {
      submissionsPayload.push({
        assignment_id: pick(assignmentIds, i),
        student_id: pick(studentIds, i),
        status: SubmissionStatus.GRADED,
        score: 92.5,
        feedback: "عمل ممتاز وهندسة رائعة للكود، الالتزام بمعايير SOLID واضح. تهانينا على اجتياز المشروع!",
        submitted_at: randomDateWithinLastDays(25, i),
        graded_at: randomDateWithinLastDays(20, i),
        graded_by: pick(instructorIds, i) || null,
      });
    }

    await prisma.assignmentSubmission.createMany({
      data: submissionsPayload,
    });
  }

  const subCount = await prisma.assignmentSubmission.count();
  console.log(`✅ Verified ${assignmentIds.length} Published Capstones and ${subCount} Graded Student Submissions.`);
}
