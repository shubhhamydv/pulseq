import '../../server/src/observability/tracing.js';
import { randomUUID } from 'node:crypto';
import { prisma, jobsRepository } from '../../server/src/repositories/jobs.repository.js';
import { executionLogsRepository } from '../../server/src/repositories/execution-logs.repository.js';
import { redisService } from '../../server/src/infrastructure/redis/redis.service.js';
import { schedulerQueue } from '../../server/src/infrastructure/redis/scheduler.queue.js';
import { createJobLockService } from '../../server/src/infrastructure/redis/job-lock.service.js';
import { JobHandlerRegistry } from './handlers/registry.js';
import { WorkerExecutor } from './worker.executor.js';
import { Worker } from './worker.js';
import { loadWorkerConfig } from './config.js';
import { WorkerRecoveryService } from './recovery.js';
import { WorkerHeartbeatService } from './heartbeat.js';
import { childLogger, errorFields } from '../../server/src/observability/logger.js';

const logger = childLogger({
  service: process.env.OTEL_SERVICE_NAME ?? 'pulseq-worker',
  event: 'worker.process',
});

const start = async (): Promise<void> => {
  const config = loadWorkerConfig();
  const workerId = process.env.WORKER_ID?.trim() || `worker-${randomUUID()}`;
  await prisma.$connect();
  logger.info({ workerId }, 'Worker connected to PostgreSQL');
  await redisService.connect();
  logger.info({ workerId }, 'Worker connected to Redis');
  const heartbeat = new WorkerHeartbeatService(
    redisService,
    workerId,
    config.heartbeatIntervalMs,
    config.heartbeatTimeoutMs
  );
  await heartbeat.register();

  const registry = new JobHandlerRegistry();
  const lockService = createJobLockService(workerId, config.lockTtlMs);
  const recovery = new WorkerRecoveryService(
    jobsRepository,
    schedulerQueue,
    redisService,
    config.processingLeaseMs
  );
  const executor = new WorkerExecutor(
    jobsRepository,
    schedulerQueue,
    registry,
    lockService,
    executionLogsRepository,
    workerId
  );
  const worker = new Worker(
    schedulerQueue,
    executor,
    config.pollIntervalMs,
    config.concurrency,
    config.batchLimit,
    recovery
  );
  const heartbeatTimer = heartbeat.heartbeatInterval(() => worker.activeCount());
  let shuttingDown = false;

  const shutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ workerId }, 'Worker graceful shutdown started');
    await heartbeat.setStatus('stopping', worker.activeCount());
    worker.stop();
    await worker.waitForIdle();
    clearInterval(heartbeatTimer);
    await heartbeat.unregister();
    await redisService.disconnect();
    await prisma.$disconnect();
    logger.info({ workerId }, 'Worker graceful shutdown completed');
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());

  await worker.run();
};

start().catch(async (error: unknown) => {
  logger.fatal({ ...errorFields(error), event: 'worker.start.failed' }, 'Worker failed to start');
  await redisService.disconnect();
  await prisma.$disconnect();
  process.exit(1);
});
