import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import {
  adminUsersQuerySchema,
  adminCoursesQuerySchema,
  adminReviewsQuerySchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  adminCreateUserSchema,
  updateCourseStatusSchema,
  updateReviewStatusSchema,
  idParamSchema
} from '../validators/admin.validator';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AdminController {
  public static async createUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = adminCreateUserSchema.parse(req.body);
      const adminId = req.user!.id;

      const newUser = await AdminService.createUser(adminId, data);
      res.status(201).json({ status: 'success', data: newUser });
    } catch (error: any) {
      if (error.message.startsWith('Conflict:')) {
        res.status(409).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Forbidden:')) {
        res.status(403).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await AdminService.getDashboard();
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminUsersQuerySchema.parse(req.query);
      const data = await AdminService.getUsers(
        query.page,
        query.limit,
        query.search,
        query.sort,
        query.order,
        query.role,
        query.status
      );
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  public static async updateUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { status } = updateUserStatusSchema.parse(req.body);
      const adminId = req.user!.id;

      const data = await AdminService.updateUserStatus(adminId, id, status);
      res.json({ status: 'success', data });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Conflict:')) {
        res.status(409).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Forbidden:')) {
        res.status(403).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async deleteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const adminId = req.user!.id;

      await AdminService.deleteUser(adminId, id);
      res.json({ success: true, message: 'User account deactivated successfully' });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Forbidden:')) {
        res.status(403).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getUserDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await AdminService.getUserDetails(id);
      res.json({ status: 'success', data });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async updateUserRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { role } = updateUserRoleSchema.parse(req.body);
      const adminId = req.user!.id;

      const data = await AdminService.updateUserRole(adminId, id, role);
      res.json({ status: 'success', data });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Conflict:')) {
        res.status(409).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Forbidden:')) {
        res.status(403).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getUserRoleHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const data = await AdminService.getUserRoleHistory(id);
      res.json({ status: 'success', data });
    } catch (error: any) {
      if (error.message === 'User not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminCoursesQuerySchema.parse(req.query);
      const data = await AdminService.getCourses(
        query.page,
        query.limit,
        query.search,
        query.sort,
        query.order,
        query.status,
        query.category,
        query.instructor
      );
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  public static async updateCourseStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { status } = updateCourseStatusSchema.parse(req.body);

      const data = await AdminService.updateCourseStatus(id, status);
      res.json({ status: 'success', data });
    } catch (error: any) {
      if (error.message === 'Course not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Conflict:')) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const query = adminReviewsQuerySchema.parse(req.query);
      const data = await AdminService.getReviews(
        query.page,
        query.limit,
        query.search,
        query.sort,
        query.order,
        query.rating,
        query.status
      );
      res.json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  public static async updateReviewStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const { status } = updateReviewStatusSchema.parse(req.body);

      const data = await AdminService.updateReviewStatus(id, status);
      res.json({ status: 'success', data });
    } catch (error: any) {
      if (error.message === 'Review not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else if (error.message.startsWith('Conflict:')) {
        res.status(409).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  public static async resetUserPassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = idParamSchema.parse(req.params);
      const adminId = req.user!.id;
      const result = await AdminService.resetUserPassword(adminId, id);
      res.status(200).json({ status: 'success', data: result });
    } catch (error: any) {
      if (error.message.startsWith('Forbidden:')) {
        res.status(403).json({ status: 'error', message: error.message });
      } else if (error.message === 'User not found') {
        res.status(404).json({ status: 'error', message: error.message });
      } else {
        next(error);
      }
    }
  }

  /**
   * Broadcast a notification to all active users.
   */
  static async broadcastNotification(req: Request, res: Response) {
    try {
      const adminId = (req as any).user!.id;
      const { title, message, type, priority, action_url } = req.body;
      
      const { NotificationService } = await import('../services/notification.service');
      const result = await NotificationService.broadcastNotification(adminId, {
        title, message, type, priority, action_url
      });
      return res.status(201).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
