import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CartService } from '../services/cart.service';

export const addCourseToCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const { courseId } = req.body;

    const result = await CartService.addCourseToCart(studentId, courseId as string);
    
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const removeCourseFromCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;
    const courseId = req.params.courseId as string;

    const result = await CartService.removeCourseFromCart(studentId, courseId);
    
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentCart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const studentId = req.user!.id;

    const cart = await CartService.getStudentCart(studentId);
    
    res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};
