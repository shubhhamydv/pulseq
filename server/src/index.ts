import './observability/tracing.js';
import express, { Express, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { trace } from '@opentelemetry/api';
import jobsRoutes from './routes/jobs.routes.js';
import { ValidationError } from './middleware/jobs.validation.js';
import { JobSchedulingError } from './services/jobs.service.js';
import { prisma } from './repositories/jobs.repository.js';
import { redisService } from './infrastructure/redis/redis.service.js';
import {
  metrics,
  prometheusRegistry,
  schedulerHttpRequestDurationSeconds,
  schedulerHttpRequestsTotal,
} from './observability/metrics.js';
import { monitoringService } from './services/monitoring.service.js';
import { publicDemoEnabled } from './middleware/public-demo.js';
import { childLogger, errorFields } from './observability/logger.js';

const app: Express = express();
const port = Number(process.env.PORT || 3000);
const nodeEnv = process.env.NODE_ENV || 'development';
const logger = childLogger({ event: 'api' });

// Middleware
app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT ?? '64kb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_BODY_LIMIT ?? '64kb' }));

// CORS middleware. In production, restrict browser access to the configured frontend origins.
const configuredOrigins = (process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use((req: Request, res: Response, next: NextFunction): void => {
  const origin = req.header('Origin');
  const allowAll = configuredOrigins.length === 0 && nodeEnv !== 'production';
  const allowed = Boolean(origin && configuredOrigins.includes(origin));
  if (origin && (allowAll || allowed)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  } else if (!origin && allowAll) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (origin && !allowed) {
    res.status(403).json({ error: 'Forbidden', message: 'Origin is not allowed.' });
    return;
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Idempotency-Key'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
});

if (publicDemoEnabled()) {
  logger.info('Public demo mode enabled with guarded job creation');
}

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.header('X-Request-ID')?.trim() || randomUUID();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationSeconds = (Date.now() - startedAt) / 1000;
    const route =
      req.route?.path ??
      (req.path === '/metrics' || req.path === '/health' || req.path === '/ready'
        ? req.path
        : 'unmatched');
    const labels = {
      method: req.method,
      route: route.startsWith('/api/v1/jobs/') ? '/api/v1/jobs/:id' : route,
      status_code: String(res.statusCode),
    };
    schedulerHttpRequestsTotal.inc(labels);
    schedulerHttpRequestDurationSeconds.observe(labels, durationSeconds);
    logger.info(
      {
        requestId,
        traceId: trace.getActiveSpan()?.spanContext().traceId,
        spanId: trace.getActiveSpan()?.spanContext().spanId,
        method: req.method,
        route,
        status: res.statusCode,
        duration: Date.now() - startedAt,
        event: 'http.request.completed',
      },
      'HTTP request completed'
    );
  });
  next();
});

// Root endpoint - API documentation
app.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    name: 'Distributed Job Scheduler API',
    version: '0.0.1',
    description: 'Backend API for Distributed Job Scheduler & Async Event Engine',
    environment: nodeEnv,
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
      jobs: {
        create: { path: '/api/v1/jobs', method: 'POST', description: 'Create a pending job' },
        get: { path: '/api/v1/jobs/:id', method: 'GET', description: 'Retrieve a job by ID' },
        list: { path: '/api/v1/jobs', method: 'GET', description: 'List jobs with pagination' },
      },
    },
    documentation: 'See README.md for complete documentation',
  });
});

app.use('/api/v1/jobs', jobsRoutes);

app.get('/metrics', async (_req: Request, res: Response): Promise<void> => {
  const promClientMetrics = await prometheusRegistry.metrics();
  const customMetrics = metrics.render();
  res.type('text/plain; version=0.0.4; charset=utf-8').send(`${promClientMetrics}${customMetrics}`);
});

app.get('/api/v1/metrics/queue', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json(await monitoringService.queueMetrics());
});
app.get('/api/v1/metrics/workers', async (req: Request, res: Response): Promise<void> => {
  const timeout = Number(
    req.query.staleAfterMs ?? process.env.WORKER_HEARTBEAT_TIMEOUT_MS ?? 20_000
  );
  res
    .status(200)
    .json(await monitoringService.workerMetrics(Number.isFinite(timeout) ? timeout : 20_000));
});
app.get('/api/v1/metrics/jobs', async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json(await monitoringService.jobMetrics());
});

const checkPostgres = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};

// Health check endpoint (dependency-aware response)
app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', async (_req: Request, res: Response): Promise<void> => {
  const [postgresql, redis] = await Promise.all([checkPostgres(), redisService.ping()]);
  res.status(postgresql && redis ? 200 : 503).json({
    status: postgresql && redis ? 'ready' : 'not_ready',
    dependencies: { postgresql, redis },
  });
});

app.get('/api/v1/health', async (_req: Request, res: Response): Promise<void> => {
  const [postgresql, redis] = await Promise.all([checkPostgres(), redisService.ping()]);
  const healthy = postgresql && redis;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    dependencies: {
      postgresql: postgresql ? 'healthy' : 'unhealthy',
      redis: redis ? 'healthy' : 'unhealthy',
    },
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint (detailed information)
app.get('/api/v1/status', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: nodeEnv,
    memory: {
      heapUsed: `${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB`,
      heapTotal: `${Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100} MB`,
    },
    version: '0.0.1',
  });
});

// 404 handler
app.use((req: Request, res: Response): void => {
  logger.warn(
    { requestId: res.locals.requestId, method: req.method, path: req.path },
    'Route not found'
  );
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource '${req.path}' was not found`,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: 'Validation Error', message: err.message });
    return;
  }
  if (err instanceof JobSchedulingError) {
    res.status(503).json({ error: 'Service Unavailable', message: err.message });
    return;
  }
  logger.error(
    {
      requestId: res.locals.requestId,
      method: req.method,
      path: req.path,
      ...errorFields(err),
      event: 'http.request.failed',
    },
    'Request failed'
  );
  res.status(500).json({
    error: 'Internal Server Error',
    message:
      nodeEnv === 'development' ? 'An unexpected server error occurred' : 'An error occurred',
    timestamp: new Date().toISOString(),
  });
});

void redisService.connect().catch(() => undefined);

// Start server
const server = app.listen(port, '0.0.0.0', () => {
  logger.info({ port, event: 'api.started' }, 'Distributed Job Scheduler API started');
});

// Graceful shutdown
const shutdown = async (): Promise<void> => {
  logger.info({ event: 'api.shutdown.started' }, 'Shutting down gracefully');
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await redisService.disconnect();
  await prisma.$disconnect();
  logger.info({ event: 'api.shutdown.completed' }, 'Server closed');
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

export default app;
