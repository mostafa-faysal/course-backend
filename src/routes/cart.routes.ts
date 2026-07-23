import { Router } from 'express';
import { addCourseToCart, removeCourseFromCart, getStudentCart } from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { CartValidator } from '../validators/cart.validator';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Shopping cart management for students
 */

/**
 * @swagger
 * /api/cart/items:
 *   post:
 *     summary: Add a course to the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the course to add
 *     responses:
 *       200:
 *         description: Course added to cart successfully
 *       400:
 *         description: Already enrolled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a student)
 *       404:
 *         description: Course not found or not published
 *       409:
 *         description: Course is already in the cart
 */
router.post(
  '/items',
  authenticate,
  authorize('STUDENT'),
  validate(CartValidator.addItemSchema),
  addCourseToCart
);

/**
 * @swagger
 * /api/cart/items/{courseId}:
 *   delete:
 *     summary: Remove a course from the shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The ID of the course to remove
 *     responses:
 *       200:
 *         description: Course removed from cart successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Item not found in cart
 */
router.delete(
  '/items/:courseId',
  authenticate,
  authorize('STUDENT'),
  validate(CartValidator.removeItemSchema),
  removeCourseFromCart
);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get student's shopping cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_price:
 *                       type: number
 *                     total_courses_count:
 *                       type: integer
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           thumbnail:
 *                             type: string
 *                             nullable: true
 *                           price:
 *                             type: number
 *                           discount_price:
 *                             type: number
 *                             nullable: true
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/',
  authenticate,
  authorize('STUDENT'),
  getStudentCart
);

export default router;
