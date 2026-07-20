import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { validate } from '../middlewares/validate.middleware';
import { createReviewSchema, getCourseReviewsSchema, updateReviewSchema, deleteReviewSchema } from '../validators/review.validator';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router({ mergeParams: true });

/**
 * @swagger
 * /api/courses/{id}/reviews:
 *   post:
 *     summary: Add a review to a course
 *     tags: [Reviews]
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
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 example: "Excellent course!"
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Token missing/invalid)
 *       403:
 *         description: Forbidden (Not a student, not enrolled, or already reviewed)
 *       404:
 *         description: Course not found
 */
router.post('/', authenticate, authorize('STUDENT'), validate(createReviewSchema), ReviewController.createReview);

/**
 * @swagger
 * /api/courses/{id}/reviews:
 *   get:
 *     summary: Get all reviews for a course
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Course UUID
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
 *         description: Number of reviews per page
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Course not found
 */
router.get('/', validate(getCourseReviewsSchema), ReviewController.getCourseReviews);

/**
 * @swagger
 * /api/courses/{id}/reviews/{reviewId}:
 *   put:
 *     summary: Update an existing review
 *     tags: [Reviews]
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
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Updated review comment"
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner of the review)
 *       404:
 *         description: Review not found
 */
router.put('/:reviewId', authenticate, authorize('STUDENT', 'ADMIN'), validate(updateReviewSchema), ReviewController.updateReview);

/**
 * @swagger
 * /api/courses/{id}/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Review UUID
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not the owner of the review)
 *       404:
 *         description: Review not found
 *       500:
 *         description: Server error
 */
router.delete('/:reviewId', authenticate, authorize('STUDENT', 'ADMIN'), validate(deleteReviewSchema), ReviewController.deleteReview);

export default router;
