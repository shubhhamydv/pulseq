import pino, { Logger } from 'pino';
import { randomUUID } from 'node:crypto';

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  jobId?: string;
  workerId?: string;
  queue?: string;
  event?: string;
  duration?: number;
  [key: string]: unknown;
}

const service = process.env.OTEL_SERVICE_NAME ?? process.env.SERVICE_NAME ?? 'pulseq-api';
const environment = process.env.NODE_ENV ?? 'development';

export const logger = pino({
  name: service,
  base: { service, environment },
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'authorization',
      '*.authorization',
      'apiKey',
      '*.apiKey',
      'DATABASE_URL',
      'REDIS_URL',
      'payload',
      'body',
      'req.body',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const childLogger = (context: LogContext = {}): Logger =>
  logger.child({ ...context, requestId: context.requestId ?? randomUUID() });

export const errorFields = (error: unknown): Record<string, unknown> => ({
  err:
    error instanceof Error
      ? { type: error.name, message: error.message, stack: error.stack }
      : { message: String(error) },
});
