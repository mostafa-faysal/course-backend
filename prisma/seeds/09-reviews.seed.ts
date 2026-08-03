import { PrismaClient, ReviewStatus } from "@prisma/client";
import { SEED_VOLUMES } from "./helpers/constants";
import { getReviewComment, randomDateWithinLastDays } from "./helpers/random";

export async function seedReviews(
  prisma: PrismaClient,
  studentIds: string[],
  courseIds: string[]
): Promise<void> {
  console.log(`\n⭐ [Stage 9] Seeding ~${SEED_VOLUMES.REVIEWS_COUNT} Verified Arabic Course Reviews (4 & 5 Stars)...`);

  // Fetch existing review pairs to enforce idempotency without modifying database schema indexes
  const existingReviews = await prisma.review.findMany({
    select: { student_id: true, course_id: true },
  });

  const existingSet = new Set(existingReviews.map((r) => `${r.student_id}_${r.course_id}`));

  const newReviewsPayload: Array<{
    student_id: string;
    course_id: string;
    rating: number;
    comment: string;
    status: ReviewStatus;
    created_at: Date;
  }> = [];

  const localUsedPairs = new Set<string>();

  let index = 0;
  let sIndex = 0;
  let cIndex = 0;

  while (
    newReviewsPayload.length + existingSet.size < SEED_VOLUMES.REVIEWS_COUNT &&
    index < studentIds.length * courseIds.length
  ) {
    const student_id = studentIds[sIndex % studentIds.length];
    const course_id = courseIds[cIndex % courseIds.length];
    const pair = `${student_id}_${course_id}`;

    if (!existingSet.has(pair) && !localUsedPairs.has(pair)) {
      localUsedPairs.add(pair);
      const { comment, rating } = getReviewComment(index);
      newReviewsPayload.push({
        student_id,
        course_id,
        rating,
        comment,
        status: ReviewStatus.APPROVED,
        created_at: randomDateWithinLastDays(45, index),
      });
    }

    index++;
    sIndex++;
    if (sIndex % studentIds.length === 0) cIndex++;
  }

  if (newReviewsPayload.length > 0) {
    await prisma.review.createMany({
      data: newReviewsPayload,
    });
  }

  const count = await prisma.review.count();
  console.log(`✅ Verified ${count} Approved Student Reviews across diplomas.`);
}
