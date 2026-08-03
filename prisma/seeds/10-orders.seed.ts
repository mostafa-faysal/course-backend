import { PrismaClient, OrderStatus } from "@prisma/client";
import { SEED_VOLUMES, FRONTEND_COURSE_TITLE, FRONTEND_COHORT_STUDENTS } from "./helpers/constants";
import { pick, randomDateWithinLastDays } from "./helpers/random";

export async function seedOrders(
  prisma: PrismaClient,
  studentIds: string[],
  courseIds: string[],
  courseIdMap: Record<string, string> = {}
): Promise<string[]> {
  console.log(`\n💳 [Stage 10] Seeding StudyFlow Coupons & ~${SEED_VOLUMES.ORDERS_COUNT} Paid Orders...`);

  // 1. Seed StudyFlow Coupons Idempotently
  const coupons = [
    { code: "STUDYFLOW2026", discount_percentage: 20.0, expiration_date: new Date("2026-12-31"), usage_limit: 500, used_count: 85 },
    { code: "RAMADAN50", discount_percentage: 50.0, expiration_date: new Date("2027-04-01"), usage_limit: 200, used_count: 120 },
    { code: "WELCOME10", discount_percentage: 10.0, expiration_date: new Date("2028-01-01"), usage_limit: 1000, used_count: 45 },
  ];

  let activeCouponId: string | null = null;
  for (const c of coupons) {
    const upserted = await prisma.coupon.upsert({
      where: { code: c.code },
      update: { discount_percentage: c.discount_percentage, expiration_date: c.expiration_date },
      create: c,
    });
    if (!activeCouponId) activeCouponId = upserted.id;
  }

  // 2. Explicitly ensure Front-End interactive cohort test accounts have verified Paid Orders
  const frontendCourseId = courseIdMap[FRONTEND_COURSE_TITLE];
  if (frontendCourseId) {
    const testUsers = await prisma.user.findMany({
      where: { email: { in: FRONTEND_COHORT_STUDENTS.map((s) => s.email) } },
      select: { id: true },
    });

    for (const u of testUsers) {
      const existingItem = await prisma.orderItem.findFirst({
        where: { course_id: frontendCourseId, order: { student_id: u.id, status: OrderStatus.COMPLETED } },
      });
      if (!existingItem) {
        await prisma.order.create({
          data: {
            student_id: u.id,
            subtotal: 7500,
            discount: 0,
            total_price: 7500,
            status: OrderStatus.COMPLETED,
            created_at: new Date(),
            items: {
              create: [
                {
                  course_id: frontendCourseId,
                  price: 7500,
                },
              ],
            },
          },
        });
      }
    }
  }

  // 3. Check existing orders to ensure strictly deterministic idempotence
  const existingOrderCount = await prisma.order.count();
  if (existingOrderCount >= SEED_VOLUMES.ORDERS_COUNT) {
    console.log(`✅ Verified ${existingOrderCount} Existing Paid Orders in database.`);
    const existing = await prisma.order.findMany({ select: { id: true } });
    return existing.map((o) => o.id);
  }

  const needed = SEED_VOLUMES.ORDERS_COUNT - existingOrderCount;
  const coursePrices = [5500, 7500, 8500, 9500, 12000];

  // We use transactions/sequential creations because OrderItem requires order_id
  for (let i = 0; i < needed; i++) {
    const student_id = pick(studentIds, i);
    const course_id = pick(courseIds, i);
    const price = pick(coursePrices, i);
    const useCoupon = i % 3 === 0;
    const discount = useCoupon ? (price * 0.2) : 0;
    const total_price = price - discount;

    await prisma.order.create({
      data: {
        student_id,
        coupon_id: useCoupon ? activeCouponId : null,
        subtotal: price,
        discount,
        total_price,
        status: OrderStatus.COMPLETED,
        created_at: randomDateWithinLastDays(60, i),
        items: {
          create: [
            {
              course_id,
              price,
            },
          ],
        },
      },
    });
  }

  const finalOrders = await prisma.order.findMany({ select: { id: true } });
  console.log(`✅ Verified ${finalOrders.length} Completed Student Orders powering live Revenue figures.`);
  return finalOrders.map((o) => o.id);
}
