import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const rateLimitResponse = (req: Request, res: Response) => {
  res.status(429).json({
    status: 'error',
    statusCode: 429,
    message: 'Too many requests, please try again later.',
    requestId: (req as any).requestId || req.headers['x-request-id'],
  });
};

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Strict limit: 10 attempts per window per IP on auth routes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      status: 'error',
      statusCode: 429,
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      requestId: (req as any).requestId || req.headers['x-request-id'],
    });
  },
});
