import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { logger } from './utils/logger.js';
import type { ErrnoException } from 'node:errors';

const config = loadConfig();
const app = createApp();

const startServer = (port: number = config.port): void => {
  const server = app.listen(port, () => {
    logger.info({ port, environment: config.nodeEnv }, 'server started');
  });

  server.on('error', (error: ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      logger.warn({ port: port + 1 }, 'port already in use, trying next');
      startServer(port + 1);
      return;
    }

    logger.error({ err: error }, 'failed to start server');
    process.exit(1);
  });
};

startServer();

process.on('SIGINT', () => {
  logger.info('shutting down');
  process.exit(0);
});
