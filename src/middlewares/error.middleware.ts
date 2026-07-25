import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  const requestId = (req as any).requestId || req.headers['x-request-id'] || 'unknown';

  // Handle Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'A resource with this unique value already exists (Conflict).';
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Requested record not found.';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed on resource.';
    } else {
      statusCode = 400;
      message = config.nodeEnv === 'production' ? 'Database request error occurred.' : `Prisma Error ${err.code}: ${err.message}`;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = config.nodeEnv === 'production' ? 'Invalid database validation input.' : err.message;
  } else if (err instanceof Prisma.PrismaClientInitializationError || err instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = config.nodeEnv === 'production' ? 'Database communication failure.' : err.message;
  }

  // Log error using Winston
  logger.error(`[Error] ${req.method} ${req.originalUrl} - Status: ${statusCode} - Message: ${message}`, {
    requestId,
    statusCode,
    stack: err.stack,
    body: req.body,
  });

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    requestId,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};

