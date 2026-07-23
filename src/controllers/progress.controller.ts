import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ProgressTrackingService } from '../services/progress.service';
import { handleDomainError } from '../utils/domain-error';

export class ProgressController {
  public static async getCourseProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;

      const progress = await ProgressTrackingService.getCourseProgress(studentId, courseId);
      res.status(200).json({
        status: 'success',
        data: progress,
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }

  public static async markLessonComplete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;
      const lessonId = req.params.lessonId as string;

      const newPercentage = await ProgressTrackingService.markLessonComplete(studentId, courseId, lessonId);
      res.status(200).json({
        status: 'success',
        message: 'Lesson marked as complete',
        data: { progress_percentage: newPercentage },
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }

  public static async markLessonIncomplete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;
      const lessonId = req.params.lessonId as string;

      const newPercentage = await ProgressTrackingService.markLessonIncomplete(studentId, courseId, lessonId);
      res.status(200).json({
        status: 'success',
        message: 'Lesson marked as incomplete',
        data: { progress_percentage: newPercentage },
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }

  public static async updateWatchPosition(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;
      const lessonId = req.params.lessonId as string;
      const { watch_position } = req.body;

      await ProgressTrackingService.updateWatchPosition(studentId, courseId, lessonId, watch_position);
      res.status(200).json({
        status: 'success',
        message: 'Watch position updated',
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }
}
