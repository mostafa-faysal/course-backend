import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { EnrollmentService } from '../services/enrollment.service';
import { handleDomainError } from '../utils/domain-error';

export class EnrollmentController {
  public static async enrollStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id; // Assumes requireAuth middleware
      const { courseId } = req.params;

      const enrollment = await EnrollmentService.enrollStudent(studentId, courseId as string);
      res.status(201).json({
        status: 'success',
        message: 'Successfully enrolled in the course',
        data: enrollment,
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }

  public static async getMyCourses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const enrollments = await EnrollmentService.getMyCourses(studentId);
      
      res.status(200).json({
        status: 'success',
        data: enrollments,
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }

  public static async getCourseEnrollmentStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const { courseId } = req.params;

      const stats = await EnrollmentService.getCourseEnrollmentStats(courseId as string, userId, role);
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      handleDomainError(error, res, next);
    }
  }
}
