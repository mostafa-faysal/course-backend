import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { FavoriteService } from '../services/favorite.service';

export class FavoriteController {
  public static addCourseToFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;

      const result = await FavoriteService.addCourseToFavorites(studentId, courseId);
      
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
      // Assuming a generic error handler or standard handleDomainError exists
      next(error);
    }
  };

  public static removeCourseFromFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;

      const result = await FavoriteService.removeCourseFromFavorites(studentId, courseId);
      
      res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
      next(error);
    }
  };

  public static getStudentFavorites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.id;

      const result = await FavoriteService.getStudentFavorites(studentId);
      
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };

  public static checkFavoriteStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.id;
      const courseId = req.params.courseId as string;

      const result = await FavoriteService.checkFavoriteStatus(studentId, courseId);
      
      res.status(200).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  };
}
