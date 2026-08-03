import { prisma } from '../config/db';
import { NotificationHelper } from '../helpers/notification.helper';
import { cache, CACHE_TAGS } from '../cache';

export class ReviewService {
  private static async invalidateReviewCaches() {
    await Promise.all([
      cache.invalidateByTag(CACHE_TAGS.HOME_TOP_RATED),
      cache.invalidateByTag(CACHE_TAGS.HOME_TESTIMONIALS),
    ]);
  }
  /**
   * Create a new review for a course
   */
  public static async createReview(studentId: string, courseId: string, data: { rating: number; comment?: string }) {
    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId,
        },
      },
      include: {
        course: { select: { instructor_id: true } }
      }
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this course');
    }

    // Check if student already reviewed this course
    const existingReview = await prisma.review.findFirst({
      where: {
        student_id: studentId,
        course_id: courseId,
      },
    });

    if (existingReview) {
      throw new Error('You have already reviewed this course');
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        student: {
          select: {
            id: true,
            full_name: true,
            profile_picture: true,
          },
        },
      },
    });
    // Notify Instructor
    if (enrollment.course?.instructor_id) {
      await NotificationHelper.sendNewCourseReview(enrollment.course.instructor_id, courseId, data.rating);
    }

    await this.invalidateReviewCaches();
    return review;
  }

  /**
   * Get all reviews for a course with pagination and stats
   */
  public static async getCourseReviews(courseId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new Error('Course not found');
    }

    const [reviews, totalCount, aggregations] = await Promise.all([
      prisma.review.findMany({
        where: { course_id: courseId, status: 'APPROVED' },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              profile_picture: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: { course_id: courseId, status: 'APPROVED' },
      }),
      prisma.review.aggregate({
        where: { course_id: courseId, status: 'APPROVED' },
        _avg: {
          rating: true,
        },
      }),
    ]);

    return {
      reviews,
      pagination: {
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      },
      average_rating: aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0,
      total_reviews: totalCount,
    };
  }

  /**
   * Update a review
   */
  public static async updateReview(courseId: string, reviewId: string, userId: string, role: string, data: { rating?: number; comment?: string }) {
    // Check if review exists and belongs to the course
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        course_id: courseId,
      },
    });

    if (!review) {
      throw new Error('Review not found for this course');
    }

    // Check authorization: Must be the owner (STUDENT) or ADMIN
    if (role !== 'ADMIN' && review.student_id !== userId) {
      throw new Error('Forbidden: You can only update your own reviews');
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.comment !== undefined && { comment: data.comment }),
      },
      include: {
        student: {
          select: {
            id: true,
            full_name: true,
            profile_picture: true,
          },
        },
      },
    });

    await this.invalidateReviewCaches();
    return updatedReview;
  }

  /**
   * Delete a review
   */
  public static async deleteReview(courseId: string, reviewId: string, userId: string, role: string) {
    // Check if review exists and belongs to the course
    const review = await prisma.review.findFirst({
      where: {
        id: reviewId,
        course_id: courseId,
      },
    });

    if (!review) {
      throw new Error('Review not found for this course');
    }

    // Check authorization: Must be the owner (STUDENT) or ADMIN
    if (role !== 'ADMIN' && review.student_id !== userId) {
      throw new Error('Forbidden: You can only delete your own reviews');
    }

    // Delete review
    try {
      await prisma.review.delete({
        where: { id: reviewId },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Review not found for this course');
      }
      throw error;
    }

    await this.invalidateReviewCaches();
    return true;
  }

  /**
   * Get rating summary for a course
   */
  public static async getRatingSummary(courseId: string) {
    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new Error('Course not found');
    }

    const [aggregations, distribution] = await Promise.all([
      prisma.review.aggregate({
        where: { course_id: courseId, status: 'APPROVED' },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: { course_id: courseId, status: 'APPROVED' },
        _count: { rating: true },
      })
    ]);

    const totalReviews = aggregations._count.rating;
    const averageRating = aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0;

    // Initialize rating distribution with 0 counts
    const ratingDistribution: Record<string, { count: number; percentage: number }> = {
      '5': { count: 0, percentage: 0 },
      '4': { count: 0, percentage: 0 },
      '3': { count: 0, percentage: 0 },
      '2': { count: 0, percentage: 0 },
      '1': { count: 0, percentage: 0 },
    };

    if (totalReviews > 0) {
      distribution.forEach((item) => {
        const count = item._count.rating;
        const percentage = Number(((count / totalReviews) * 100).toFixed(2));
        ratingDistribution[item.rating.toString()] = { count, percentage };
      });
    }

    return {
      average_rating: averageRating,
      total_reviews: totalReviews,
      rating_distribution: ratingDistribution,
    };
  }
}
