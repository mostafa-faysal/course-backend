import { Router } from 'express';
import { LessonController } from '../controllers/lesson.controller';
import { validate } from '../middlewares/validate.middleware';
import { createLessonSchema, updateLessonSchema, deleteLessonSchema } from '../validators/lesson.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/courses/{courseId}/sections/{sectionId}/lessons:
 *   post:
 *     summary: Create a new lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Section UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - duration
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to React"
 *               duration:
 *                 type: integer
 *                 example: 120
 *                 description: "Duration in minutes or seconds"
 *               video_url:
 *                 type: string
 *                 format: uri
 *                 example: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *               is_free_preview:
 *                 type: boolean
 *                 example: true
 *               sequence_order:
 *                 type: integer
 *                 example: 1
 *                 description: "Optional. Automatically assigned if not provided."
 *     responses:
 *       201:
 *         description: Lesson created successfully
 *       400:
 *         description: Validation error or duplicate title
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not instructor or admin)
 *       404:
 *         description: Course or section not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(createLessonSchema), LessonController.createLesson);

/**
 * @swagger
 * /api/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}:
 *   patch:
 *     summary: Update a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced React"
 *               duration:
 *                 type: integer
 *                 example: 90
 *               video_url:
 *                 type: string
 *                 format: uri
 *               is_free_preview:
 *                 type: boolean
 *               sequence_order:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Lesson updated successfully
 *       400:
 *         description: Validation error or duplicate title
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course, Section, or Lesson not found
 *       500:
 *         description: Server error
 */
router.patch('/:lessonId', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(updateLessonSchema), LessonController.updateLesson);

/**
 * @swagger
 * /api/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}:
 *   delete:
 *     summary: Delete a lesson
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lesson deleted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Course, Section, or Lesson not found
 *       500:
 *         description: Server error
 */
router.delete('/:lessonId', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(deleteLessonSchema), LessonController.deleteLesson);

export default router;
