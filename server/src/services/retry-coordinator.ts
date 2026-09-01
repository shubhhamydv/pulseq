import { Job, JobStatus } from '@prisma/client';
import { DeadLetterQueue, deadLetterQueue } from '../infrastructure/redis/dead-letter.queue.js';
import { SchedulerQueue, schedulerQueue } from '../infrastructure/redis/scheduler.queue.js';
import { JobsRepository, jobsRepository } from '../repositories/jobs.repository.js';
import { calculateRetryDelay, loadRetryConfig, RetryConfig } from './retry-policy.js';

export type FailureDisposition = 'RETRIED' | 'DLQ';

export class RetryCoordinator {
  public constructor(
    private readonly repository: JobsRepository,
    private readonly queue: SchedulerQueue,
    private readonly dlq: DeadLetterQueue,
    private readonly config: RetryConfig = loadRetryConfig(),
    private readonly now: () => Date = () => new Date(),
    private readonly random: () => number = Math.random
  ) {}

  public async handleFailure(job: Job, error: string): Promise<FailureDisposition> {
    const nextRetryCount = job.retryCount + 1;
    if (nextRetryCount > job.maxRetries) {
      await this.repository.updateJob(job.id, {
        status: JobStatus.FAILED,
        retryCount: nextRetryCount,
        lastError: error,
        processingStartedAt: null,
      });
      await this.dlq.add(job.id);
      return 'DLQ';
    }

    const scheduledAt = new Date(
      this.now().getTime() + calculateRetryDelay(nextRetryCount, this.config, this.random)
    );
    await this.repository.updateJob(job.id, {
      status: JobStatus.PENDING,
      retryCount: nextRetryCount,
      lastError: error,
      scheduledAt,
      processingStartedAt: null,
    });
    await this.queue.enqueue(job.id, scheduledAt, job.priority);
    return 'RETRIED';
  }
}

export const retryCoordinator = new RetryCoordinator(
  jobsRepository,
  schedulerQueue,
  deadLetterQueue
);
