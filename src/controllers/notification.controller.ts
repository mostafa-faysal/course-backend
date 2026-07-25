import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {

  /**
   * Get paginated notifications for the authenticated user.
   */
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const type = req.query.type as string | any;
      const priority = req.query.priority as string | any;
      
      let is_read: boolean | undefined = undefined;
      if (req.query.is_read !== undefined) {
        is_read = req.query.is_read === 'true';
      }

      const result = await NotificationService.getUserNotifications(userId, page, limit, type, is_read, priority);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get only the count of unread notifications for fast polling (badges).
   */
  static async getUnreadCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const count = await NotificationService.getUnreadCount(userId);
      return res.status(200).json({ success: true, unread_count: count });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get notification details. Automatically marks it as read and returns updated unread_count.
   */
  static async getNotificationDetails(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const notificationId = req.params.id as string;

      const result = await NotificationService.getAndMarkAsRead(userId, notificationId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Notification not found' || error.message === 'Notification has expired') {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Explicitly mark a notification as read.
   */
  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const notificationId = req.params.id as string;

      const result = await NotificationService.markAsRead(userId, notificationId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Notification not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mark all unread notifications as read.
   */
  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const result = await NotificationService.markAllAsRead(userId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete a single notification.
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const notificationId = req.params.id as string;

      const result = await NotificationService.deleteNotification(userId, notificationId);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.message === 'Notification not found') {
        return res.status(404).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Clear all notifications for the user.
   */
  static async deleteAllNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).user!.id;
      const result = await NotificationService.deleteAllNotifications(userId);
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}
