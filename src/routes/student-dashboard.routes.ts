import { Router } from 'express';
import { StudentDashboardController } from '../controllers/student-dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Student Dashboard
 *   description: Aggregated student dashboard metrics and views
 */

/**
 * @swagger
 * /api/student-dashboard/certificates/verify/{credentialId}:
 *   get:
 *     summary: Verify a certificate (Public)
 *     description: مسار عام (Public Endpoint) لا يتطلب تسجيل دخول. وظيفته هي التحقق من صحة أي شهادة مصدرة من المنصة باستخدام رقم الاعتماد (Credential ID). يمكن استخدامه من قبل أصحاب العمل أو أي جهة للتأكد من أن الشهادة صحيحة ومسجلة في النظام.
 *     tags: [Student Dashboard]
 *     parameters:
 *       - in: path
 *         name: credentialId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Certificate is valid
 */
router.get('/certificates/verify/:credentialId', StudentDashboardController.verifyCertificate);

// Protected Student Dashboard Routes
router.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * /api/student-dashboard/overview:
 *   get:
 *     summary: Get dashboard overview metrics
 *     description: يجلب ملخص أداء الطالب (Overview) ليتم عرضه في أعلى لوحة التحكم (Dashboard). يعيد إحصائيات سريعة مثل عدد الكورسات المكتملة، الكورسات قيد الدراسة، وإجمالي الشهادات التي حصل عليها الطالب. مفيد لواجهة المستخدم لتوفير نظرة سريعة على الإنجازات.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overview metrics retrieved
 */
router.get('/overview', StudentDashboardController.getOverview);

/**
 * @swagger
 * /api/student-dashboard/courses:
 *   get:
 *     summary: Get enrolled courses
 *     description: يجلب جميع الكورسات التي سجل فيها الطالب (My Courses) مع تفاصيل التقدم (Progress Percentage) الخاص بكل كورس. يستخدم في الفرونت اند لعرض مكتبة الكورسات الخاصة بالطالب.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrolled courses retrieved
 */
router.get('/courses', StudentDashboardController.getMyCourses);

/**
 * @swagger
 * /api/student-dashboard/continue-watching:
 *   get:
 *     summary: Get recently watched courses
 *     description: يجلب أحدث الكورسات التي يتفاعل معها الطالب حالياً مع تحديد آخر درس شاهده للعودة إليه مباشرة (Resume). يستخدم لعرض عنصر تحكم مباشر (Continue Watching) في لوحة التحكم لتسهيل الاستكمال.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Continue watching data retrieved
 */
router.get('/continue-watching', StudentDashboardController.getContinueWatching);

/**
 * @swagger
 * /api/student-dashboard/certificates:
 *   get:
 *     summary: Get earned certificates
 *     description: يجلب قائمة بجميع الشهادات التي حصل عليها الطالب. يُستخدم في لوحة تحكم الطالب بداخل قسم (شهاداتي) لتنزيلها أو مشاركتها.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Certificates retrieved
 */
router.get('/certificates', StudentDashboardController.getCertificates);

/**
 * @swagger
 * /api/student-dashboard/certificates/{courseId}:
 *   post:
 *     summary: Claim a new certificate
 *     description: يقوم بإنشاء شهادة جديدة للطالب لكورس محدد، ولكن فقط إذا كان نسبة تقدمه في الكورس 100%. يستخدم عند ضغط الطالب على زر (استخراج الشهادة) بعد إنهاء الكورس.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Certificate claimed successfully
 */
router.post('/certificates/:courseId', StudentDashboardController.claimCertificate);

export default router;
