import { Request, Response, NextFunction } from 'express';
import { ReviewService } from '../services/review.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ReviewController {
  /**
   * Create a course review
   */
  public static async createReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string; 
      const studentId = req.user!.id;
      const data = req.body;

      const review = await ReviewService.createReview(studentId, courseId, data);

      return res.status(201).json({
        status: 'success',
        message: 'Review created successfully',
        data: review,
      });
    } catch (error: any) {
      if (error.message === 'Student is not enrolled in this course' || error.message === 'You have already reviewed this course') {
        return res.status(403).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }

  /**
   * Get course reviews
   */
  public static async getCourseReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const data = await ReviewService.getCourseReviews(courseId, page, limit);

      return res.status(200).json({
        status: 'success',
        message: 'Reviews retrieved successfully',
        data,
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }

  /**
   * Update a course review
   */
  public static async updateReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string;
      const reviewId = req.params.reviewId as string;
      const userId = req.user!.id;
      const role = req.user!.role;
      const data = req.body;

      const review = await ReviewService.updateReview(courseId, reviewId, userId, role, data);

      return res.status(200).json({
        status: 'success',
        message: 'Review updated successfully',
        data: review,
      });
    } catch (error: any) {
      if (error.message === 'Review not found for this course') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      if (error.message.startsWith('Forbidden')) {
        return res.status(403).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }

  /**
   * Delete a course review
   */
  public static async deleteReview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string;
      const reviewId = req.params.reviewId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      await ReviewService.deleteReview(courseId, reviewId, userId, role);

      return res.status(200).json({
        status: 'success',
        message: 'Review deleted successfully',
      });
    } catch (error: any) {
      if (error.message === 'Review not found for this course') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      if (error.message.startsWith('Forbidden')) {
        return res.status(403).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }

  /**
   * Get rating summary for a course
   */
  public static async getRatingSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.id as string;
      
      const summary = await ReviewService.getRatingSummary(courseId);

      return res.status(200).json({
        status: 'success',
        message: 'Rating summary retrieved successfully',
        data: summary,
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }
}
