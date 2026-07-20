import { Response, NextFunction } from 'express';
import { LessonService } from '../services/lesson.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { handleDomainError } from '../utils/domain-error';
export class LessonController {
  /**
   * Create a new lesson
   */
  public static async createLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const sectionId = req.params.sectionId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const lesson = await LessonService.createLesson(courseId, sectionId, userId, role, req.body);

      res.status(201).json({
        status: 'success',
        message: 'Lesson created successfully',
        data: lesson,
      });
    } catch (error: any) {
      handleDomainError(error, res, next);
    }
  }

  /**
   * Update a lesson
   */
  public static async updateLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const sectionId = req.params.sectionId as string;
      const lessonId = req.params.lessonId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      const updatedLesson = await LessonService.updateLesson(courseId, sectionId, lessonId, userId, role, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Lesson updated successfully',
        data: updatedLesson,
      });
    } catch (error: any) {
      handleDomainError(error, res, next);
    }
  }

  /**
   * Delete a lesson
   */
  public static async deleteLesson(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const courseId = req.params.courseId as string;
      const sectionId = req.params.sectionId as string;
      const lessonId = req.params.lessonId as string;
      const userId = req.user!.id;
      const role = req.user!.role;

      await LessonService.deleteLesson(courseId, sectionId, lessonId, userId, role);

      res.status(200).json({
        status: 'success',
        message: 'Lesson deleted successfully',
      });
    } catch (error: any) {
      handleDomainError(error, res, next);
    }
  }
}
