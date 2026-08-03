import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderService {
  /**
   * Creates an order from the student's cart within a transaction.
   * Validates cart, creates Order, OrderItems (with frozen prices), and Payment.
   */
  static async createOrder(studentId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate Cart
      const cart = await tx.cart.findUnique({
        where: { student_id: studentId },
        include: {
          items: {
            include: { course: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw { status: 400, message: 'Cart is empty' };
      }

      const courseIds = cart.items.map((item) => item.course_id);
      
      // Check if student already enrolled in any course
      const enrollments = await tx.enrollment.findMany({
        where: {
          student_id: studentId,
          course_id: { in: courseIds },
        },
      });

      if (enrollments.length > 0) {
        throw { status: 400, message: 'Cart contains courses you are already enrolled in' };
      }

      // Check course status
      for (const item of cart.items) {
        if (item.course.status !== 'PUBLISHED') {
          throw { status: 400, message: `Course "${item.course.title}" is no longer available for purchase` };
        }
      }

      // 2. Calculate prices and prepare OrderItems
      let subtotal = 0;
      let total_price = 0;

      const orderItemsData = cart.items.map(item => {
        const activePrice = item.course.discount_price !== null ? item.course.discount_price : item.course.price;
        subtotal += item.course.price;
        total_price += activePrice;
        
        // Save the active price at the time of purchase as per requirements
        return {
          course_id: item.course.id,
          price: activePrice
        };
      });

      const discount = subtotal - total_price;

      // 3. Create Order, OrderItems, and Payment (PENDING) in one query
      const order = await tx.order.create({
        data: {
          student_id: studentId,
          subtotal,
          discount,
          total_price,
          status: 'PENDING',
          items: {
            create: orderItemsData
          },
          payment: {
            create: {
              payment_method: 'MOCK',
              status: 'PENDING'
            }
          }
        },
        include: {
          items: true,
          payment: true
        }
      });

      return order;
    });
  }

  /**
   * Retrieves order history for a student
   */
  static async getOrderHistory(studentId: string) {
    return await prisma.order.findMany({
      where: { student_id: studentId },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnail: true,
                card_image: true,
                cover_image: true,
              }
            }
          }
        },
        payment: true
      },
      orderBy: { created_at: 'desc' }
    });
  }
}
