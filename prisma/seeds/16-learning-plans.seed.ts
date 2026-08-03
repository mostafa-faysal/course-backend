import { PrismaClient } from "@prisma/client";
import { pick } from "./helpers/random";

export async function seedLearningPlans(prisma: PrismaClient, studentIds: string[], courseIds: string[]): Promise<void> {
  console.log(`\n🧭 [Stage 16] Seeding Personalized Study Roadmaps & Learning Plans...`);

  const sampleStudents = studentIds.slice(0, Math.min(50, studentIds.length));

  const planPayload = sampleStudents.map((sId) => ({
    student_id: sId,
  }));

  await prisma.learningPlan.createMany({
    data: planPayload,
    skipDuplicates: true,
  });

  const plans = await prisma.learningPlan.findMany({
    where: { student_id: { in: sampleStudents } },
    select: { id: true },
  });

  const planItemsPayload: Array<{ learning_plan_id: string; course_id: string; sequence_order: number }> = [];
  for (let i = 0; i < plans.length; i++) {
    // 3 progressive course steps per learning roadmap
    planItemsPayload.push({
      learning_plan_id: plans[i].id,
      course_id: pick(courseIds, 1), // Fundamentals
      sequence_order: 1,
    });
    planItemsPayload.push({
      learning_plan_id: plans[i].id,
      course_id: pick(courseIds, 0), // Node or React
      sequence_order: 2,
    });
    planItemsPayload.push({
      learning_plan_id: plans[i].id,
      course_id: pick(courseIds, 7), // Advanced AI or Java
      sequence_order: 3,
    });
  }

  await prisma.learningPlanItem.createMany({
    data: planItemsPayload,
    skipDuplicates: true,
  });

  console.log(`✅ Verified ${plans.length} Personalized Student Learning Plans with step-by-step course roadmaps.`);
}
