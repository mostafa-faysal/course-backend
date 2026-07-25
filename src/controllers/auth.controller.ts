import { Response, Request, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message && error.message.includes('Bad Request')) {
        return res.status(400).json({ success: false, error: error.message.replace('Bad Request: ', '') });
      }
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      if (error.message && error.message.includes('Unauthorized')) {
        return res.status(401).json({ success: false, error: error.message.replace('Unauthorized: ', '') });
      }
      if (error.message && error.message.includes('Forbidden')) {
        return res.status(403).json({ success: false, error: error.message.replace('Forbidden: ', '') });
      }
      next(error);
    }
  }

  public static async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // req.user is populated by the auth middleware if the token is valid
      // Ideally we fetch fresh data from DB here instead of relying solely on the token payload
      // to ensure the user is still active and exists.
      // But since we just need the core identity:
      res.status(200).json({
        success: true,
        data: {
          id: req.user!.id,
          role: req.user!.role
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = changePasswordSchema.parse(req.body);
      const userId = req.user!.id;
      const result = await AuthService.changePassword(userId, data);
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      if (error.message && error.message.includes('Forbidden')) {
        return res.status(403).json({ success: false, error: error.message.replace('Forbidden: ', '') });
      }
      next(error);
    }
  }
}
