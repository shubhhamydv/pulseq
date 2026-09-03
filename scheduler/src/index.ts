import '../../server/src/observability/tracing.js';
import { randomUUID } from 'node:crypto';
import { prisma } from '../../server/src/repositories/jobs.repository.js';
import { recurringJobsRepository } from '../../server/src/repositories/recurring-jobs.repository.js';
import { redisService } from '../../server/src/infrastructure/redis/redis.service.js';
import { schedulerQueue } from '../../server/src/infrastructure/redis/scheduler.queue.js';
import { JobLockService } from '../../server/src/infrastructure/redis/job-lock.service.js';
import { RecurringSchedulerService } from '../../server/src/services/recurring-scheduler.service.js';
import { childLogger, errorFields } from '../../server/src/observability/logger.js';

const logger = childLogger({
  service: process.env.OTEL_SERVICE_NAME ?? 'pulseq-scheduler',
  event: 'scheduler.process',
});
const intervalMs = Number(process.env.SCHEDULER_POLL_INTERVAL_MS ?? 1_000);

const start = async (): Promise<void> => {
  const schedulerId = process.env.SCHEDULER_ID?.trim() || `scheduler-${randomUUID()}`;
  await prisma.$connect();
  await redisService.connect();
  const service = new RecurringSchedulerService(
    recurringJobsRepository,
    schedulerQueue,
    new JobLockService(
      redisService,
      schedulerId,
      Number(process.env.SCHEDULER_LOCK_TTL_MS ?? 30_000)
    )
  );
  let running = true;
  const stop = async (): Promise<void> => {
    running = false;
    await redisService.disconnect();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void stop());
  process.on('SIGTERM', () => void stop());
  logger.info({ schedulerId }, 'Recurring scheduler started');
  while (running) {
    try {
      await service.runOnce();
    } catch (error) {
      logger.error({ ...errorFields(error), event: 'scheduler.error' }, 'Scheduler poll failed');
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
};

start().catch(async (error: unknown) => {
  logger.fatal({ ...errorFields(error), event: 'scheduler.error' }, 'Scheduler failed to start');
  await redisService.disconnect();
  await prisma.$disconnect();
  process.exit(1);
});
