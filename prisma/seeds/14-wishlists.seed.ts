import { PrismaClient } from "@prisma/client";
import { SEED_VOLUMES } from "./helpers/constants";
import { pick } from "./helpers/random";

export async function seedWishlists(prisma: PrismaClient, studentIds: string[], courseIds: string[]): Promise<void> {
  console.log(`\n💖 [Stage 14] Batched Seeding of ~${SEED_VOLUMES.WISHLIST_COUNT} Student Wishlists...`);

  const sampleStudents = studentIds.slice(0, Math.min(SEED_VOLUMES.WISHLIST_COUNT, studentIds.length));

  const wishlistPayload = sampleStudents.map((sId) => ({
    student_id: sId,
  }));

  await prisma.wishlist.createMany({
    data: wishlistPayload,
    skipDuplicates: true,
  });

  const wishlists = await prisma.wishlist.findMany({
    where: { student_id: { in: sampleStudents } },
    select: { id: true },
  });

  const wishlistItemsPayload: Array<{ wishlist_id: string; course_id: string }> = [];
  for (let i = 0; i < wishlists.length; i++) {
    // Each student saves 2 favorite courses in their wishlist
    wishlistItemsPayload.push({
      wishlist_id: wishlists[i].id,
      course_id: pick(courseIds, i),
    });
    wishlistItemsPayload.push({
      wishlist_id: wishlists[i].id,
      course_id: pick(courseIds, i + 3),
    });
  }

  await prisma.wishlistItem.createMany({
    data: wishlistItemsPayload,
    skipDuplicates: true,
  });

  console.log(`✅ Verified ${wishlists.length} Student Wishlists with favorite saved courses.`);
}
