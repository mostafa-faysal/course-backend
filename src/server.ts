import app from './app';
import { config } from './config/env';
import { prisma } from './config/db';
import { logger } from './utils/logger';

const startServer = () => {
  try {
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server is running in ${config.nodeEnv} mode on port ${config.port}`);
      logger.info(`🔒 CORS configured for origin: ${config.corsOrigin}`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.warn(`⚠️ Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err);
          process.exit(1);
        }
        
        logger.info('🛑 HTTP server closed gracefully.');

        try {
          await prisma.$disconnect();
          logger.info('🔌 Database connections disconnected cleanly.');
          process.exit(0);
        } catch (dbError) {
          logger.error('Error disconnecting database:', dbError);
          process.exit(1);
        }
      });

      // Force close after 10 seconds if connections hang
      setTimeout(() => {
        logger.error('⏰ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

