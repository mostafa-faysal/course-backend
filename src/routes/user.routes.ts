import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: User Profile
 *   description: Universal user profile management
 */

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: يجلب بيانات الملف الشخصي الكاملة للمستخدم الحالي (مثل الاسم، الإيميل، الصورة، والسيرة الذاتية). نحتاجه في الفرونت اند لصفحة (حسابي/الملف الشخصي) لعرض بيانات المستخدم وإمكانية تعديلها.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/profile', UserController.getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     description: يسمح للمستخدم بتحديث بيانات ملفه الشخصي (الاسم، السيرة الذاتية، الصورة الشخصية). نحتاجه في الفرونت اند بداخل صفحة (إعدادات الحساب) ليتمكن المستخدم من حفظ تعديلاته.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', UserController.updateProfile);

export default router;
