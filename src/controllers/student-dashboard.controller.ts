import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StudentDashboardService } from '../services/student-dashboard.service';
import { z } from 'zod';

const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid Course ID format')
});

const credentialIdParamSchema = z.object({
  credentialId: z.string().min(1, 'Credential ID is required')
});

export class StudentDashboardController {
  public static async getOverview(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const overview = await StudentDashboardService.getDashboardOverview(studentId);
      res.status(200).json({ success: true, data: overview });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyCourses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const courses = await StudentDashboardService.getMyCourses(studentId);
      res.status(200).json({ success: true, data: courses });
    } catch (error) {
      next(error);
    }
  }

  public static async getContinueWatching(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const progress = await StudentDashboardService.getContinueWatching(studentId);
      res.status(200).json({ success: true, data: progress });
    } catch (error) {
      next(error);
    }
  }

  public static async getCertificates(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const certificates = await StudentDashboardService.getCertificates(studentId);
      res.status(200).json({ success: true, data: certificates });
    } catch (error) {
      next(error);
    }
  }

  public static async claimCertificate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { courseId } = courseIdParamSchema.parse(req.params);
      const studentId = req.user!.id;

      const certificate = await StudentDashboardService.claimCertificate(studentId, courseId);
      res.status(201).json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyCertificate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { credentialId } = credentialIdParamSchema.parse(req.params);
      const certificate = await StudentDashboardService.verifyCertificate(credentialId);
      res.status(200).json({ success: true, data: certificate });
    } catch (error) {
      next(error);
    }
  }
}
