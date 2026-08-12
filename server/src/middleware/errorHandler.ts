import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    logger.warn({ statusCode: error.statusCode, details: error.details }, error.message);
    res.status(error.statusCode).json({
      status: 'error',
      error: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  logger.error({ err: error }, 'Unhandled error');
  res.status(500).json({
    status: 'error',
    error: 'Internal Server Error',
    timestamp: new Date().toISOString(),
  });
};
