import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CourseController {
  public static async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const course = await CourseService.createCourse(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Course created successfully',
        data: course,
      });
    } catch (error: any) {
      if (error.message.includes('not found') || error.message.includes('not an instructor')) {
        res.status(400).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getAllCourses(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate query middleware already parses default values via Zod
      const result = await CourseService.getAllCourses(req.query);
      res.status(200).json({
        status: 'success',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // 1. Get the course to verify existence and ownership
      const course = await CourseService.getCourseById(id);
      if (!course) {
        return res.status(404).json({ status: 'error', message: 'Course not found' });
      }

      // 2. Authorization check: must be Admin, or the Instructor who owns this course
      if (userRole === 'INSTRUCTOR' && course.instructor_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to modify this course',
        });
      }

      // 3. Perform update
      const updated = await CourseService.updateCourse(id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Course updated successfully',
        data: updated,
      });
    } catch (error: any) {
      if (error.message === 'Category not found') {
        res.status(400).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async deleteCourse(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // 1. Get the course to verify existence and ownership
      const course = await CourseService.getCourseById(id);
      if (!course) {
        return res.status(404).json({ status: 'error', message: 'Course not found' });
      }

      // 2. Authorization check: must be Admin, or the Instructor who owns this course
      if (userRole === 'INSTRUCTOR' && course.instructor_id !== userId) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to delete this course',
        });
      }

      // 3. Perform delete
      await CourseService.deleteCourse(id);
      res.status(200).json({
        status: 'success',
        message: 'Course deleted successfully',
      });
    } catch (error: any) {
      if (error.code === 'P2003' || error.message?.includes('foreign key constraint')) {
        res.status(400).json({
          status: 'error',
          message: 'Cannot delete course: It has active enrollments, sections, or other dependencies.',
        });
      } else {
        next(error);
      }
    }
  }

  public static async getCourseDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const course = await CourseService.getCourseDetails(id);
      if (!course) {
        return res.status(404).json({ status: 'error', message: 'Course not found' });
      }
      res.status(200).json({
        status: 'success',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get related courses
   */
  public static async getRelatedCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const courses = await CourseService.getRelatedCourses(id, limit);
      res.status(200).json({
        status: 'success',
        message: 'Related courses retrieved successfully',
        data: courses,
      });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        return res.status(404).json({ status: 'error', message: error.message });
      }
      next(error);
    }
  }
}




