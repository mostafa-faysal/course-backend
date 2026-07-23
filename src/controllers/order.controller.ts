import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { OrderService } from '../services/order.service';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const order = await OrderService.createOrder(studentId);
    
    res.status(201).json({
      status: 'success',
      message: 'Order created successfully. Pending payment.',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const orders = await OrderService.getOrderHistory(studentId);
    
    res.status(200).json({
      status: 'success',
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
