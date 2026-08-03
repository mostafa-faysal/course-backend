import { PrismaClient } from "@prisma/client";
import { SEED_VOLUMES } from "./helpers/constants";
import { pick } from "./helpers/random";

export async function seedCarts(prisma: PrismaClient, studentIds: string[], courseIds: string[]): Promise<void> {
  console.log(`\n🛒 [Stage 13] Batched Seeding of ~${SEED_VOLUMES.CART_COUNT} Active Student Carts...`);

  const sampleStudents = studentIds.slice(0, Math.min(SEED_VOLUMES.CART_COUNT, studentIds.length));

  const cartPayload = sampleStudents.map((sId) => ({
    student_id: sId,
  }));

  await prisma.cart.createMany({
    data: cartPayload,
    skipDuplicates: true,
  });

  const carts = await prisma.cart.findMany({
    where: { student_id: { in: sampleStudents } },
    select: { id: true },
  });

  const cartItemsPayload: Array<{ cart_id: string; course_id: string }> = [];
  for (let i = 0; i < carts.length; i++) {
    cartItemsPayload.push({
      cart_id: carts[i].id,
      course_id: pick(courseIds, i + 2),
    });
    if (i % 2 === 0) {
      cartItemsPayload.push({
        cart_id: carts[i].id,
        course_id: pick(courseIds, i + 5),
      });
    }
  }

  await prisma.cartItem.createMany({
    data: cartItemsPayload,
    skipDuplicates: true,
  });

  console.log(`✅ Verified ${carts.length} Active Carts with ${cartItemsPayload.length} pending unpurchased items.`);
}
