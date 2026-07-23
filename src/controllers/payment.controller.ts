import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { PaymentService } from '../services/payment.service';

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const { orderId, success } = req.body;

    const result = await PaymentService.verifyPayment(orderId, studentId, success);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        order: result.order,
        payment: result.payment,
      },
    });
  } catch (error) {
    next(error);
  }
};
