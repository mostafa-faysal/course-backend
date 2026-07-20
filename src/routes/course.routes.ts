import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { validate } from '../middlewares/validate.middleware';
import { createCourseSchema, getAllCoursesSchema, updateCourseSchema, deleteCourseSchema, getCourseDetailsSchema } from '../validators/course.validator';
import { ReviewController } from '../controllers/review.controller';
import { getRatingSummarySchema } from '../validators/review.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import reviewRoutes from './review.routes';
import sectionRoutes from './section.routes';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

/**
 * @swagger
 * /api/courses:
 *   post:
 *     summary: Create a new course
 *     tags: [Courses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - instructor_id
 *               - category_id
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced TypeScript Masterclass"
 *               description:
 *                 type: string
 *                 example: "Learn advanced patterns in TypeScript for enterprise apps."
 *               instructor_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *               category_id:
 *                 type: string
 *                 format: uuid
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               price:
 *                 type: number
 *                 example: 99.99
 *               discount_price:
 *                 type: number
 *                 example: 49.99
 *               level:
 *                 type: string
 *                 example: "Advanced"
 *               language:
 *                 type: string
 *                 example: "English"
 *               status:
 *                 type: string
 *                 enum: [DRAFT, PUBLISHED, HIDDEN]
 *                 example: "DRAFT"
 *     responses:
 *       201:
 *         description: Course created successfully
 *       400:
 *         description: Validation error or Instructor/Category not found
 */
router.post('/', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(createCourseSchema), CourseController.createCourse);

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Get all courses with pagination, search, and filters
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category UUID
 *       - in: query
 *         name: instructor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by instructor UUID
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *         description: Filter by course level (e.g. Beginner)
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *         description: Filter by course language
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Filter by minimum price
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Filter by maximum price
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, PUBLISHED, HIDDEN]
 *         description: Filter by status
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [price, created_at, title, enrollments]
 *           default: created_at
 *         description: Sort field (enrollments sorts by popularity)
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of courses retrieved successfully
 */
router.get('/', validate(getAllCoursesSchema), CourseController.getAllCourses);

/**
 * @swagger
 * /api/courses/{id}:
 *   put:
 *     summary: Update an existing course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced TypeScript Masterclass (Updated)"
 *               description:
 *                 type: string
 *                 example: "Updated description about advanced patterns."
 *               price:
 *                 type: number
 *                 example: 79.99
 *               discount_price:
 *                 type: number
 *                 example: 39.99
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       400:
 *         description: Invalid inputs or category not found
 *       401:
 *         description: Unauthorized (Token missing/invalid)
 *       403:
 *         description: Forbidden (Not Admin or owner Instructor)
 *       404:
 *         description: Course not found
 */
router.put('/:id', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(updateCourseSchema), CourseController.updateCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   delete:
 *     summary: Delete a course
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *     responses:
 *       200:
 *         description: Course deleted successfully
 *       400:
 *         description: Foreign key relation violation or bad request
 *       401:
 *         description: Unauthorized (Token missing/invalid)
 *       403:
 *         description: Forbidden (Not Admin or owner Instructor)
 *       404:
 *         description: Course not found
 */
router.delete('/:id', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(deleteCourseSchema), CourseController.deleteCourse);

/**
 * @swagger
 * /api/courses/{id}:
 *   get:
 *     summary: Get detailed information of a course (Public)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *     responses:
 *       200:
 *         description: Course details retrieved successfully
 *       400:
 *         description: Invalid UUID format
 *       404:
 *         description: Course not found
 */
router.get('/:id', validate(getCourseDetailsSchema), CourseController.getCourseDetails);

/**
 * @swagger
 * /api/courses/{id}/rating-summary:
 *   get:
 *     summary: Get rating summary and distribution for a course (Public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *     responses:
 *       200:
 *         description: Rating summary retrieved successfully
 *       400:
 *         description: Invalid UUID format
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get('/:id/rating-summary', validate(getRatingSummarySchema), ReviewController.getRatingSummary);

/**
 * @swagger
 * /api/courses/{id}/related:
 *   get:
 *     summary: Get related courses for a given course (Public)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of related courses to return
 *     responses:
 *       200:
 *         description: Related courses retrieved successfully
 *       400:
 *         description: Invalid UUID format
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.get('/:id/related', validate(getCourseDetailsSchema), CourseController.getRelatedCourses);

// Nested Review Routes
router.use('/:id/reviews', reviewRoutes);

// Nested Section Routes
router.use('/:courseId/sections', sectionRoutes);

export default router;

