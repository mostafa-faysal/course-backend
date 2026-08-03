import { Router } from 'express';
import { InstructorController } from '../controllers/instructor.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { 
  instructorPaginationSchema, 
  instructorRevenueSchema, 
  instructorCourseStatsSchema,
  instructorRevokeStudentSchema
} from '../validators/instructor.validator';

const router = Router();

// All routes require authentication and INSTRUCTOR role
router.use(authenticate);
router.use(authorize('INSTRUCTOR'));

/**
 * @swagger
 * tags:
 *   name: Instructor Dashboard
 *   description: Instructor specific analytics and management
 */

/**
 * @swagger
 * /api/instructor/profile:
 *   get:
 *     summary: Get instructor profile
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', InstructorController.getProfile);

/**
 * @swagger
 * /api/instructor/dashboard:
 *   get:
 *     summary: Get instructor dashboard overview
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', InstructorController.getDashboard);

/**
 * @swagger
 * /api/instructor/courses:
 *   get:
 *     summary: Get courses taught by the instructor
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           default: desc
 *     responses:
 *       200:
 *         description: Paginated courses
 */
router.get('/courses', validate(instructorPaginationSchema), InstructorController.getCourses);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/stats:
 *   get:
 *     summary: Get specific course statistics
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course statistics
 */
router.get('/courses/:courseId/stats', validate(instructorCourseStatsSchema), InstructorController.getCourseStats);

/**
 * @swagger
 * /api/instructor/revenue:
 *   get:
 *     summary: Get revenue statistics
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, year, all]
 *           default: all
 *     responses:
 *       200:
 *         description: Revenue statistics
 */
router.get('/revenue', validate(instructorRevenueSchema), InstructorController.getRevenue);

/**
 * @swagger
 * /api/instructor/students:
 *   get:
 *     summary: Get students enrolled in instructor's courses
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: limit
 *       - in: query
 *         name: search
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *         description: Filter students enrolled in a specific course
 *       - in: query
 *         name: sort
 *       - in: query
 *         name: order
 *     responses:
 *       200:
 *         description: Paginated students
 *       403:
 *         description: Forbidden
 */
router.get('/students', validate(instructorPaginationSchema), InstructorController.getStudents);

/**
 * @swagger
 * /api/instructor/enrollments/latest:
 *   get:
 *     summary: Get latest enrollments
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: limit
 *     responses:
 *       200:
 *         description: Latest enrollments
 */
router.get('/enrollments/latest', validate(instructorPaginationSchema), InstructorController.getLatestEnrollments);

/**
 * @swagger
 * /api/instructor/reviews:
 *   get:
 *     summary: Get reviews for instructor's courses
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: limit
 *       - in: query
 *         name: search
 *       - in: query
 *         name: sort
 *       - in: query
 *         name: order
 *     responses:
 *       200:
 *         description: Paginated reviews
 *       403:
 *         description: Forbidden
 */
router.get('/reviews', validate(instructorPaginationSchema), InstructorController.getReviews);

/**
 * @swagger
 * /api/instructor/courses/{courseId}/students/{studentId}/revoke:
 *   patch:
 *     summary: Revoke a student's enrollment from a course
 *     description: يتيح للإنستراكتور تجميد/إلغاء اشتراك طالب في كورس معين (بتحويل الحالة إلى REVOKED) وإرسال إشعار فوري له، مع حفظ الفاتورة المالية في قاعدة البيانات بدون حذف.
 *     tags: [Instructor Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment revoked successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Enrollment or Course not found
 *       409:
 *         description: Enrollment already revoked
 */
router.patch('/courses/:courseId/students/:studentId/revoke', validate(instructorRevokeStudentSchema), InstructorController.revokeStudent);

export default router;
