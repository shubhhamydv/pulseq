import express, { Express } from 'express';
import cors from 'cors';
import { loadConfig } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createHealthRoutes } from './routes/healthRoutes.js';
import { logger } from './utils/logger.js';

interface CreateAppOptions {
  beforeNotFound?: (app: Express) => void;
}

export const createApp = (options: CreateAppOptions = {}): Express => {
  const app = express();
  const config = loadConfig();

  app.set('config', config);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(requestLogger);

  app.get('/', (_req, res) => {
    res.status(200).json({
      name: 'Distributed Job Scheduler API',
      version: '0.0.1',
      description: 'Backend API for Distributed Job Scheduler & Async Event Engine',
      environment: config.nodeEnv,
      endpoints: {
        health: {
          path: '/api/v1/health',
          method: 'GET',
          description: 'Check if the server is running',
        },
        status: {
          path: '/api/v1/status',
          method: 'GET',
          description: 'Get detailed server status information',
        },
      },
      documentation: 'See README.md for complete documentation',
    });
  });

  app.use('/api/v1', createHealthRoutes());

  if (options.beforeNotFound) {
    options.beforeNotFound(app);
  }

  app.get('/api/v1/status', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      memory: {
        heapUsed: `${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB`,
        heapTotal: `${Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100} MB`,
      },
      version: '0.0.1',
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      error: 'Not Found',
      message: `The requested resource '${req.path}' was not found`,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  });

  app.use(errorHandler);
  logger.info({ env: config.nodeEnv }, 'application initialized');

  return app;
};
