import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authRateLimiter } from '../middlewares/rate-limit.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User registration and login
 * 
 * components:
 *   schemas:
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 full_name:
 *                   type: string
 *                 role:
 *                   type: string
 *             token:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new student
 *     description: يتم استخدام هذا الـ API لإنشاء حساب جديد كطالب (Student). نحتاجه في الفرونت اند لصفحة التسجيل، وبمجرد نجاحه يرجع بيانات المستخدم مع التوكين (JWT) لتسجيل الدخول مباشرة بدون خطوة إضافية.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - email
 *               - password
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request (e.g., email already exists)
 */
router.post('/register', authRateLimiter, AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to an account
 *     description: تسجيل الدخول للمنصة. نحتاجه في الفرونت اند للتحقق من إيميل وباسورد المستخدم وإرجاع التوكين (JWT) الذي سيُستخدم في كل الطلبات القادمة (Requests) للـ API لإثبات هوية المستخدم.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account suspended or deleted
 */
router.post('/login', authRateLimiter, AuthController.login);

// Protected Auth Routes

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout (Client-side token drop)
 *     description: تسجيل الخروج من النظام. حالياً يتم الاعتماد على تنفيذه في الفرونت اند عبر مسح التوكين من الـ Local Storage، لكن هذا الـ API متوفر كخطوة استباقية (Placeholder) لإمكانية التوسع مستقبلاً وإضافة التوكين للقائمة السوداء (Blacklist).
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user core identity
 *     description: يجلب الهوية الأساسية للمستخدم الحالي (مثل الـ ID والـ Role). نحتاجه جداً في الفرونت اند عند عمل Refresh للصفحة أو أول تحميل (Initial Load) للتأكد من أن التوكين لا يزال صالحاً، ولتوجيه المستخدم بناءً على صلاحياته (طالب، مدرب، آدمن).
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns user ID and Role
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @swagger
 * /api/auth/change-password:
 *   patch:
 *     summary: Change own password
 *     description: يسمح للمستخدم بتغيير كلمة المرور الخاصة به. نحتاجه في الفرونت اند لصفحة (الإعدادات / الأمان)، ويتطلب معرفة كلمة المرور الحالية قبل التغيير كإجراء أمني.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation Error
 *       403:
 *         description: Forbidden (Incorrect current password or password reuse)
 */
router.patch('/change-password', authenticate, authRateLimiter, AuthController.changePassword);

export default router;

