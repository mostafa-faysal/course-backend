import { Router } from 'express';
import { createOrder, getOrderHistory } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createOrderSchema } from '../validators/order.validator';

const router = Router();

// Require Student Role for all order routes
router.use(authenticate, authorize('STUDENT'));

// POST /api/orders
router.post('/', validate(createOrderSchema), createOrder);

// GET /api/orders/history
router.get('/history', getOrderHistory);

export default router;
