import app from './app';
import { config } from './config/env';

const startServer = () => {
  try {
    app.listen(config.port, () => {
      console.log(`Server is running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
