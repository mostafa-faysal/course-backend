import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token' });
  }
};

/**
 * Optional authentication middleware.
 * If a token is provided, it validates it and sets req.user.
 * If no token is provided, it proceeds as an unauthenticated request.
 * If an invalid token is provided, it can either ignore it or throw 401. Based on requirements, "Only validate the token if it exists."
 * We will return 401 ONLY if a token exists but is invalid, to prevent malicious tokens from passing silently.
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Proceed without req.user
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    // If a token is explicitly provided but invalid, we reject the request.
    return res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid token' });
  }
};
