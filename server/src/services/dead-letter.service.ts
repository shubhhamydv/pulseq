import { Job, JobStatus } from '@prisma/client';
import { DeadLetterQueue, deadLetterQueue } from '../infrastructure/redis/dead-letter.queue.js';
import { SchedulerQueue, schedulerQueue } from '../infrastructure/redis/scheduler.queue.js';
import { JobsRepository, jobsRepository } from '../repositories/jobs.repository.js';
import { JobNotFoundError, InvalidStateTransitionError } from './jobs.service.js';

export class DeadLetterService {
  public constructor(
    private readonly repository: JobsRepository,
    private readonly dlq: DeadLetterQueue,
    private readonly queue: SchedulerQueue
  ) {}

  public async list(): Promise<Job[]> {
    const ids = await this.dlq.list();
    const jobs = await Promise.all(ids.map((id) => this.repository.findJobById(id)));
    return jobs.filter((job): job is Job => job !== null);
  }

  public async replay(id: string): Promise<Job> {
    const job = await this.repository.findJobById(id);
    if (job === null) throw new JobNotFoundError(id);
    if (job.status !== JobStatus.FAILED)
      throw new InvalidStateTransitionError(job.status, JobStatus.PENDING);
    const updated = await this.repository.retryJob(id, new Date());
    if (updated === null) throw new InvalidStateTransitionError(job.status, JobStatus.PENDING);
    await this.dlq.remove(id);
    await this.queue.enqueue(id, updated.scheduledAt);
    return updated;
  }
}

export const deadLetterService = new DeadLetterService(
  jobsRepository,
  deadLetterQueue,
  schedulerQueue
);
