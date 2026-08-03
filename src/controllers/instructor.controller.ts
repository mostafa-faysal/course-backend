import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { InstructorService } from '../services/instructor.service';

export class InstructorController {
  public static async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const profile = await InstructorService.getProfile(instructorId);
      res.json({ status: 'success', data: profile });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const dashboard = await InstructorService.getDashboard(instructorId);
      res.json({ status: 'success', data: dashboard });
    } catch (error) {
      next(error);
    }
  }

  public static async getCourses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const { page, limit, search, sort, order } = req.query;
      const courses = await InstructorService.getCourses(
        instructorId,
        Number(page),
        Number(limit),
        search as string,
        sort as string,
        order as string
      );
      res.json({ status: 'success', data: courses });
    } catch (error) {
      next(error);
    }
  }

  public static async getCourseStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const courseId = req.params.courseId as string;
      const stats = await InstructorService.getCourseStats(instructorId, courseId);
      res.json({ status: 'success', data: stats });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else if (error.message === 'Forbidden: Course belongs to another instructor') {
        res.status(403).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getRevenue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const period = (req.query.period as 'month' | 'year' | 'all') || 'all';
      const revenue = await InstructorService.getRevenue(instructorId, period);
      res.json({ status: 'success', data: revenue });
    } catch (error) {
      next(error);
    }
  }

  public static async getStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const { page, limit, search, course_id, sort, order } = req.query;
      const students = await InstructorService.getStudents(
        instructorId,
        Number(page),
        Number(limit),
        search as string,
        course_id as string,
        sort as string,
        order as string
      );
      res.json({ status: 'success', data: students });
    } catch (error) {
      next(error);
    }
  }

  public static async getLatestEnrollments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const { page, limit } = req.query;
      const enrollments = await InstructorService.getLatestEnrollments(
        instructorId,
        Number(page),
        Number(limit)
      );
      res.json({ status: 'success', data: enrollments });
    } catch (error) {
      next(error);
    }
  }

  public static async getReviews(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const { page, limit, search, sort, order } = req.query;
      const reviews = await InstructorService.getReviews(
        instructorId,
        Number(page),
        Number(limit),
        search as string,
        sort as string,
        order as string
      );
      res.json({ status: 'success', data: reviews });
    } catch (error) {
      next(error);
    }
  }

  public static async revokeStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const instructorId = req.user!.id;
      const { courseId, studentId } = req.params;
      const result = await InstructorService.revokeStudentEnrollment(instructorId, courseId as string, studentId as string);
      res.status(200).json({ status: 'success', message: 'Student enrollment revoked successfully', data: result });
    } catch (error: any) {
      if (error.message.includes('Forbidden')) return res.status(403).json({ status: 'error', message: error.message });
      if (error.message.includes('Not Found')) return res.status(404).json({ status: 'error', message: error.message });
      if (error.message.includes('Conflict')) return res.status(409).json({ status: 'error', message: error.message });
      next(error);
    }
  }
}
