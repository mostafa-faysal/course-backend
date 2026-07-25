import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All notification routes require the user to be authenticated
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: In-app Notification System
 */

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     description: يقوم هذا الـ API بإرجاع عدد الإشعارات غير المقروءة فقط. تم إنشاؤه لعمل استعلام خفيف (Light polling) لتحديث أيقونة الجرس (Badge) في الفرونت اند بدون الحاجة لتحميل لستة الإشعارات كاملة، مما يوفر استهلاك البيانات ويحسن الأداء.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 unread_count:
 *                   type: integer
 */
router.get('/unread-count', NotificationController.getUnreadCount);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     description: يقوم بتغيير حالة كل الإشعارات غير المقروءة لتصبح مقروءة بضغطة زر واحدة. نحتاجه في الفرونت اند لزر (Mark all as read) لتنظيف القائمة ويرجع الـ unread_count كـ 0.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read successfully
 */
router.patch('/read-all', NotificationController.markAllAsRead);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get paginated notifications
 *     description: يجلب تاريخ الإشعارات الخاصة بالمستخدم بنظام الـ Pagination. كما يسمح بالفلترة عبر النوع (type) أو الأهمية (priority) أو حالة القراءة. تم إنشاؤه ليعرض الإشعارات في صفحة الإشعارات الكاملة أو قائمة الـ Dropdown في الفرونت اند، مع استبعاد الإشعارات منتهية الصلاحية.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by NotificationType (e.g., SYSTEM, COURSE)
 *       - in: query
 *         name: is_read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority (LOW, MEDIUM, HIGH)
 *     responses:
 *       200:
 *         description: Notifications list retrieved
 */
router.get('/', NotificationController.getNotifications);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Delete all notifications
 *     description: يمسح كل إشعارات المستخدم بشكل نهائي. مخصص لزر (Clear All) في الفرونت اند لتفريغ صندوق الإشعارات بالكامل.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications deleted
 */
router.delete('/', NotificationController.deleteAllNotifications);

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get notification details
 *     description: يجلب تفاصيل إشعار محدد. تم تحسين هذا الـ API بحيث لو كان الإشعار غير مقروء وقام المستخدم بفتحه، سيقوم هذا الـ API تلقائياً بتحديث حالته إلى مقروء ويرجع الـ unread_count الجديد، مما يوفر على الفرونت اند إرسال طلب (Request) إضافي لتحديث الحالة.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification details
 *       404:
 *         description: Notification not found or expired
 */
router.get('/:id', NotificationController.getNotificationDetails);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a single notification as read
 *     description: يحول حالة إشعار واحد فقط ليكون مقروء مع إرجاع العدد المتبقي للإشعارات غير المقروءة. يمكن استخدامه لو كان هناك زر صغير (علامة مقروء) بجانب الإشعار ليتم النقر عليه بدون الدخول لصفحة التفاصيل.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.patch('/:id/read', NotificationController.markAsRead);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a single notification
 *     description: يمسح إشعار واحد فقط نهائياً من قاعدة البيانات.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', NotificationController.deleteNotification);

export default router;
