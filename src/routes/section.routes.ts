import { Router } from 'express';
import { SectionController } from '../controllers/section.controller';
import { validate } from '../middlewares/validate.middleware';
import { createSectionSchema, updateSectionSchema, deleteSectionSchema } from '../validators/section.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import lessonRoutes from './lesson.routes';

const router = Router({ mergeParams: true });

// Mount lesson routes
router.use('/:sectionId/lessons', lessonRoutes);

/**
 * @swagger
 * /api/courses/{courseId}/sections:
 *   post:
 *     summary: Create a new section
 *     tags: [Sections]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to React"
 *               sequence_order:
 *                 type: integer
 *                 example: 1
 *                 description: Optional. If omitted, it defaults to the end.
 *     responses:
 *       201:
 *         description: Section created successfully
 *       400:
 *         description: Validation error or Duplicate title
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not instructor or admin)
 *       404:
 *         description: Course not found
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(createSectionSchema), SectionController.createSection);

/**
 * @swagger
 * /api/courses/{courseId}/sections/{sectionId}:
 *   put:
 *     summary: Update a section
 *     tags: [Sections]
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
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Advanced React Hooks"
 *               sequence_order:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Section updated successfully
 *       400:
 *         description: Validation error or Duplicate title
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not instructor or admin)
 *       404:
 *         description: Course or Section not found
 *       500:
 *         description: Server error
 */
router.put('/:sectionId', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(updateSectionSchema), SectionController.updateSection);

/**
 * @swagger
 * /api/courses/{courseId}/sections/{sectionId}:
 *   delete:
 *     summary: Delete a section
 *     tags: [Sections]
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
 *     responses:
 *       200:
 *         description: Section deleted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not instructor or admin)
 *       404:
 *         description: Course or Section not found
 *       500:
 *         description: Server error
 */
router.delete('/:sectionId', authenticate, authorize('INSTRUCTOR', 'ADMIN'), validate(deleteSectionSchema), SectionController.deleteSection);

export default router;
