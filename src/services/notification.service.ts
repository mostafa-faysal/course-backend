import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

export class NotificationService {
  
  static async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
    type?: string | any,
    is_read?: boolean,
    priority?: string | any
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      user_id: userId,
      OR: [
        { expires_at: null },
        { expires_at: { gt: new Date() } }
      ],
      ...(type && { type }),
      ...(is_read !== undefined && { is_read }),
      ...(priority && { priority })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    const unread_count = await this.getUnreadCount(userId);

    return {
      success: true,
      data: notifications,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
      unread_count
    };
  }

  static async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        user_id: userId,
        is_read: false,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });
  }

  static async getAndMarkAsRead(userId: string, notificationId: string) {
    let notification = await prisma.notification.findFirst({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.expires_at && notification.expires_at < new Date()) {
      throw new Error('Notification has expired');
    }

    if (!notification.is_read) {
      notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          is_read: true,
          read_at: new Date(),
        },
      });
    }

    const unread_count = await this.getUnreadCount(userId);

    return {
      success: true,
      data: notification,
      unread_count,
    };
  }

  static async markAsRead(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { is_read: true, read_at: new Date() }
    });

    const unread_count = await this.getUnreadCount(userId);

    return {
      success: true,
      message: 'Notification marked as read',
      unread_count
    };
  }

  static async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() }
    });

    return {
      success: true,
      message: 'All notifications marked as read',
      unread_count: 0
    };
  }

  static async deleteNotification(userId: string, notificationId: string) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, user_id: userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    const unread_count = await this.getUnreadCount(userId);

    return {
      success: true,
      message: 'Notification deleted successfully',
      unread_count
    };
  }

  static async deleteAllNotifications(userId: string) {
    await prisma.notification.deleteMany({
      where: { user_id: userId }
    });

    return {
      success: true,
      message: 'All notifications deleted successfully',
      unread_count: 0
    };
  }

  // Admin APIs
  static async broadcastNotification(
    adminId: string, 
    data: { title: string; message: string; type?: string | any; priority?: string | any; action_url?: string }
  ) {
    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true }
    });

    const notifications = users.map((user) => ({
      user_id: user.id,
      title: data.title,
      message: data.message,
      type: data.type || 'SYSTEM',
      priority: data.priority || 'MEDIUM',
      action_url: data.action_url,
    }));

    await prisma.notification.createMany({
      data: notifications
    });

    return {
      success: true,
      message: `Broadcasted to ${notifications.length} users.`,
    };
  }
}
