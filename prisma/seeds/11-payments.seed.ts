import { PrismaClient, PaymentStatus } from "@prisma/client";
import { randomDateWithinLastDays } from "./helpers/random";

export async function seedPayments(prisma: PrismaClient, orderIds: string[]): Promise<void> {
  console.log(`\n💵 [Stage 11] Seeding Payment Transactions for Completed Orders...`);

  const methods = ["Credit Card (Visa/Mastercard)", "Fawry Pay", "Mada Debit", "Apple Pay", "PayPal"];

  const paymentPayload = orderIds.map((order_id, idx) => ({
    order_id,
    payment_method: methods[idx % methods.length],
    status: PaymentStatus.SUCCESS,
    transaction_id: `TXN_SF_2026_${100000 + idx}`,
    created_at: randomDateWithinLastDays(60, idx),
  }));

  await prisma.payment.createMany({
    data: paymentPayload,
    skipDuplicates: true,
  });

  const count = await prisma.payment.count();
  console.log(`✅ Verified ${count} Completed Payment Transactions in StudyFlow DB.`);
}
