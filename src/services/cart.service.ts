import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class CartService {
  /**
   * Internal method to validate the student's cart for checkout
   * Ensures cart exists, items are valid, published, and not already enrolled.
   */
  static async validateCart(studentId: string) {
    const cart = await prisma.cart.findUnique({
      where: { student_id: studentId },
      include: {
        items: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw { status: 400, message: 'Cart is empty' };
    }

    // Check if any course is unavailable or already enrolled
    const courseIds = cart.items.map((item) => item.course_id);
    
    // Check enrollments
    const enrollments = await prisma.enrollment.findMany({
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

    return cart;
  }

  /**
   * Add a course to the student's cart
   */
  static async addCourseToCart(studentId: string, courseId: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check if course exists and is available
      const course = await tx.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        throw { status: 404, message: 'Course not found' };
      }

      if (course.status !== 'PUBLISHED') {
        throw { status: 404, message: 'Course is not available for purchase' };
      }

      // 2. Check if student is already enrolled
      const isEnrolled = await tx.enrollment.findUnique({
        where: {
          student_id_course_id: {
            student_id: studentId,
            course_id: courseId,
          },
        },
      });

      if (isEnrolled) {
        throw { status: 400, message: 'You are already enrolled in this course' };
      }

      // 3. Get or create cart
      let cart = await tx.cart.findUnique({
        where: { student_id: studentId },
      });

      if (!cart) {
        cart = await tx.cart.create({
          data: {
            student_id: studentId,
          },
        });
      }

      // 4. Add course to cart item (with fallback for uniqueness)
      try {
        await tx.cartItem.create({
          data: {
            cart_id: cart.id,
            course_id: courseId,
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw { status: 409, message: 'Course is already in your cart' };
        }
        throw error;
      }

      return { message: 'Course added to cart successfully' };
    });
  }

  /**
   * Remove a course from the student's cart
   */
  static async removeCourseFromCart(studentId: string, courseId: string) {
    // 1. Get student's cart
    const cart = await prisma.cart.findUnique({
      where: { student_id: studentId },
    });

    if (!cart) {
      throw { status: 404, message: 'Item not found in cart' };
    }

    // 2. Attempt to delete item
    try {
      await prisma.cartItem.delete({
        where: {
          cart_id_course_id: {
            cart_id: cart.id,
            course_id: courseId,
          },
        },
      });
      return { message: 'Course removed from cart successfully' };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw { status: 404, message: 'Item not found in cart' };
      }
      throw error;
    }
  }

  /**
   * Get student's cart and calculate totals
   */
  static async getStudentCart(studentId: string) {
    const cart = await prisma.cart.findUnique({
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
                price: true,
                discount_price: true,
                duration_hours: true,
                duration_weeks: true,
                projects_count: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return {
        total_price: 0,
        total_courses_count: 0,
        items: [],
      };
    }

    let totalPrice = 0;
    const coursesList = cart.items.map((item) => {
      const activePrice = item.course.discount_price !== null ? item.course.discount_price : item.course.price;
      totalPrice += activePrice;
      return item.course;
    });

    return {
      total_price: totalPrice,
      total_courses_count: coursesList.length,
      items: coursesList,
    };
  }
}
