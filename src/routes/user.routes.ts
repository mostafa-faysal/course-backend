import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

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
 *     summary: Update user profile with optional avatar image upload
 *     description: يسمح للمستخدم بتحديث بيانات ملفه الشخصي (الاسم، السيرة الذاتية، وصورة البروفايل عبر ملف مباشر من الجهاز كـ multipart/form-data). نحتاجه في الفرونت اند بداخل صفحة (إعدادات الحساب) ليتمكن المستخدم من حفظ تعديلاته ورفع صورته مباشرة عبر الباك اند.
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture image file (Max 5MB - JPEG, PNG, WebP)
 *               full_name:
 *                 type: string
 *                 description: User full name
 *                 example: "Ahmed Ali"
 *               bio:
 *                 type: string
 *                 description: User short bio
 *                 example: "Senior Software Engineer & Mentor"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                       example: "https://res.cloudinary.com/.../avatars/user-id/uuid.webp"
 */
router.put('/profile', upload.single('avatar'), UserController.updateProfile);

export default router;

