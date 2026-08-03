import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class FavoriteService {
  /**
   * Add a course to student's favorites (Wishlist)
   */
  public static async addCourseToFavorites(studentId: string, courseId: string) {
    // 1. Check if course exists and is PUBLISHED
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, status: true },
    });

    if (!course || course.status !== 'PUBLISHED') {
      throw new Error('Course not found');
    }

    // 2. Fetch or create wishlist inside a transaction
    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let wishlist = await tx.wishlist.findUnique({
        where: { student_id: studentId },
      });

      if (!wishlist) {
        wishlist = await tx.wishlist.create({
          data: { student_id: studentId },
        });
      }

      // 3. Check if already exists (Idempotency)
      const existingItem = await tx.wishlistItem.findUnique({
        where: {
          wishlist_id_course_id: {
            wishlist_id: wishlist.id,
            course_id: courseId,
          },
        },
      });

      if (existingItem) {
        return { message: 'Course is already in favorites' };
      }

      // 4. Add to wishlist
      await tx.wishlistItem.create({
        data: {
          wishlist_id: wishlist.id,
          course_id: courseId,
        },
      });

      return { message: 'Course added to favorites successfully' };
    });
  }

  /**
   * Remove a course from student's favorites (Idempotent)
   */
  public static async removeCourseFromFavorites(studentId: string, courseId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { student_id: studentId },
    });

    if (!wishlist) {
      return { message: 'Course removed from favorites successfully' }; // Idempotent
    }

    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        wishlist_id_course_id: {
          wishlist_id: wishlist.id,
          course_id: courseId,
        },
      },
    });

    if (!existingItem) {
      return { message: 'Course removed from favorites successfully' }; // Idempotent
    }

    await prisma.wishlistItem.delete({
      where: { id: existingItem.id },
    });

    return { message: 'Course removed from favorites successfully' };
  }

  /**
   * Get all favorite courses for a student
   */
  public static async getStudentFavorites(studentId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { student_id: studentId },
      include: {
        items: {
          orderBy: { created_at: 'desc' },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                price: true,
                status: true,
                duration_hours: true,
                duration_weeks: true,
                projects_count: true,
                thumbnail: true,
                card_image: true,
                cover_image: true,
              },
            },
          },
        },
      },
    });

    if (!wishlist) {
      return { total: 0, favorites: [] };
    }

    const favorites = wishlist.items.map((item: any) => {
      // is_available logic: currently just PUBLISHED
      // can be extended later: && !item.course.deleted_at
      const isAvailable = item.course.status === 'PUBLISHED';

      return {
        id: item.id,
        course_id: item.course_id,
        created_at: item.created_at,
        is_available: isAvailable,
        course: item.course,
      };
    });

    return {
      total: favorites.length,
      favorites,
    };
  }

  /**
   * Check if a course is in student's favorites
   */
  public static async checkFavoriteStatus(studentId: string, courseId: string) {
    const wishlist = await prisma.wishlist.findUnique({
      where: { student_id: studentId },
      select: { id: true },
    });

    if (!wishlist) {
      return { is_favorite: false };
    }

    const item = await prisma.wishlistItem.findUnique({
      where: {
        wishlist_id_course_id: {
          wishlist_id: wishlist.id,
          course_id: courseId,
        },
      },
      select: { id: true },
    });

    return { is_favorite: !!item };
  }
}
