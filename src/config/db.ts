import { PrismaClient } from '@prisma/client';
import { config } from './env';

export const prisma = new PrismaClient({
  ...(config.nodeEnv === 'development' && {
    log: ['query', 'info', 'warn', 'error'],
  }),
});
