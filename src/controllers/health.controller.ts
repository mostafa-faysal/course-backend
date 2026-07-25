import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export class HealthController {
  static async check(req: Request, res: Response): Promise<void> {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();
    const requestId = (req as any).requestId || req.headers['x-request-id'];

    try {
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: 'ok',
        database: 'connected',
        uptime,
        timestamp,
        requestId,
      });
    } catch (error) {
      logger.error('Health check failed: Database unreachable', { error, requestId });
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
        uptime,
        timestamp,
        requestId,
      });
    }
  }
}
