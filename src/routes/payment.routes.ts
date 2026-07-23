import { Router } from 'express';
import { verifyPayment } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { validate } from '../middlewares/validate.middleware';
import { verifyPaymentSchema } from '../validators/payment.validator';

const router = Router();

// Verify Payment API
router.post('/verify', authenticate, authorize('STUDENT'), validate(verifyPaymentSchema), verifyPayment);

export default router;
