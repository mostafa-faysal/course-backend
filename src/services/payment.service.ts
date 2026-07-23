import { PrismaClient } from '@prisma/client';
import { MockPaymentProvider } from '../providers/mock-payment.provider';

const prisma = new PrismaClient();

export class PaymentService {
  /**
   * Verifies payment using MockPaymentProvider.
   * If successful, updates status, creates enrollments, and clears the cart, all inside a transaction.
   */
  static async verifyPayment(orderId: string, studentId: string, isSuccess: boolean) {
    // 1. Fetch Order and validate ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: true,
      },
    });

    if (!order) {
      throw { status: 404, message: 'Order not found' };
    }

    if (order.student_id !== studentId) {
      throw { status: 403, message: 'Forbidden: Order does not belong to you' };
    }

    // 2. Prevent duplicate payment
    if (order.status === 'COMPLETED' || order.payment?.status === 'SUCCESS') {
      throw { status: 409, message: 'Conflict: Order is already paid' };
    }

    // 3. Process Payment via Provider
    const paymentResult = await MockPaymentProvider.processPayment(
      order.id,
      order.total_price,
      isSuccess
    );

    // 4. Handle Result within a Transaction
    return await prisma.$transaction(async (tx) => {
      if (paymentResult.status === 'SUCCESS') {
        // Update Payment
        const payment = await tx.payment.update({
          where: { order_id: order.id },
          data: {
            status: 'SUCCESS',
            transaction_id: paymentResult.transactionId,
          },
        });

        // Update Order
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'COMPLETED' },
        });

        // Create Enrollments
        const enrollmentsData = order.items.map((item) => ({
          student_id: studentId,
          course_id: item.course_id,
        }));

        if (enrollmentsData.length > 0) {
          await tx.enrollment.createMany({
            data: enrollmentsData,
            skipDuplicates: true,
          });
        }

        // Clear Cart
        const cart = await tx.cart.findUnique({
          where: { student_id: studentId },
        });

        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cart_id: cart.id },
          });
        }

        return { order: updatedOrder, payment, message: 'Payment successful' };
      } else {
        // Handle Failure
        const payment = await tx.payment.update({
          where: { order_id: order.id },
          data: { status: 'FAILED' },
        });

        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: { status: 'FAILED' },
        });

        return { order: updatedOrder, payment, message: 'Payment failed' };
      }
    });
  }
}
