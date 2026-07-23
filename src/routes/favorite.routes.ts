import { Router } from 'express';
import { FavoriteController } from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { FavoriteValidator } from '../validators/favorite.validator';
import { z } from 'zod';

const router = Router();

// Apply auth to all favorites routes
router.use(authenticate, authorize('STUDENT'));

/**
 * @swagger
 * /api/favorites:
 *   get:
 *     summary: Get all favorite courses for the student
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite courses retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', FavoriteController.getStudentFavorites);

/**
 * @swagger
 * /api/favorites/{courseId}:
 *   post:
 *     summary: Add a course to favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course added to favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Course not found or not published
 */
router.post(
  '/:courseId',
  validate(z.object({ params: FavoriteValidator.courseIdParam })),
  FavoriteController.addCourseToFavorites
);

/**
 * @swagger
 * /api/favorites/{courseId}:
 *   delete:
 *     summary: Remove a course from favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Course removed from favorites successfully
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/:courseId',
  validate(z.object({ params: FavoriteValidator.courseIdParam })),
  FavoriteController.removeCourseFromFavorites
);

/**
 * @swagger
 * /api/favorites/{courseId}/status:
 *   get:
 *     summary: Check if a course is in favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Favorite status retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/:courseId/status',
  validate(z.object({ params: FavoriteValidator.courseIdParam })),
  FavoriteController.checkFavoriteStatus
);

export default router;
