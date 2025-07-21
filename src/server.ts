import App from './app';
import logger from './utils/logger';

const app = new App();

process.on('uncaughtException', (error: Error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

app.listen();
