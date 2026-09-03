import pino from 'pino';
import { JobsRepository } from '../../server/src/repositories/jobs.repository.js';
import { SchedulerQueue } from '../../server/src/infrastructure/redis/scheduler.queue.js';
import { RedisService } from '../../server/src/infrastructure/redis/redis.service.js';
import { jobLockKey } from '../../server/src/infrastructure/redis/job-lock.service.js';

const logger = pino({ name: 'worker-recovery' });

export class WorkerRecoveryService {
  public constructor(
    private readonly repository: JobsRepository,
    private readonly queue: SchedulerQueue,
    private readonly redis: RedisService,
    private readonly leaseMs = 60_000
  ) {}

  public async recoverStaleJobs(now = new Date()): Promise<number> {
    const staleBefore = new Date(now.getTime() - this.leaseMs);
    const candidates = await this.repository.listStaleProcessing(staleBefore);
    let recovered = 0;
    for (const job of candidates) {
      const owner = await this.redis.getValue(jobLockKey(job.id));
      if (owner !== null) continue;
      const recoveredJob = await this.repository.recoverStaleJob(job.id, now);
      if (recoveredJob !== null) {
        await this.queue.enqueue(job.id, now, job.priority);
        recovered += 1;
        logger.warn({ jobId: job.id }, 'Recovered stale processing job');
      }
    }
    return recovered;
  }
}
