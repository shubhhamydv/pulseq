import { Job, JobStatus, Prisma } from '@prisma/client';
import pino from 'pino';
import { SchedulerQueue, schedulerQueue } from '../infrastructure/redis/scheduler.queue.js';
import { jobsSubmitted, recordJobEnqueued } from '../observability/metrics.js';
import {
  CreateJobInput,
  JobsRepository,
  ListJobsOptions,
  PaginatedJobs,
} from '../repositories/jobs.repository.js';

export interface CreateJobRequest {
  jobType: string;
  payload: Prisma.InputJsonValue;
  scheduledAt?: Date;
  priority?: number;
  maxRetries?: number;
  idempotencyKey?: string;
  requestId?: string;
  traceparent?: string;
  tracestate?: string;
}

export class JobNotFoundError extends Error {
  public constructor(id: string) {
    super(`Job '${id}' was not found`);
    this.name = 'JobNotFoundError';
  }
}

const logger = pino({ name: 'jobs-service' });

export class JobSchedulingError extends Error {
  public constructor() {
    super('Job was persisted but could not be scheduled');
    this.name = 'JobSchedulingError';
  }
}

export class InvalidStateTransitionError extends Error {
  public constructor(from: JobStatus, to: JobStatus) {
    super(`Invalid job state transition: ${from} → ${to}`);
    this.name = 'InvalidStateTransitionError';
  }
}

export const validJobTransitions: Record<JobStatus, readonly JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING, JobStatus.CANCELLED],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
  [JobStatus.CANCELLED]: [],
};

export class JobsService {
  public constructor(
    private readonly repository: JobsRepository,
    private readonly queue: SchedulerQueue = schedulerQueue
  ) {}

  public async createJob(input: CreateJobRequest): Promise<Job> {
    const idempotencyKey = input.idempotencyKey?.trim() || undefined;
    if (idempotencyKey !== undefined) {
      const existing = await this.repository.findJobByIdempotencyKey(idempotencyKey);
      if (existing !== null) return existing;
    }
    const data: CreateJobInput = {
      jobType: input.jobType.trim(),
      payload: input.payload,
      scheduledAt: input.scheduledAt,
      priority: input.priority,
      maxRetries: input.maxRetries,
      idempotencyKey,
      requestId: input.requestId,
      traceparent: input.traceparent,
      tracestate: input.tracestate,
    };
    let job: Job;
    try {
      job = await this.repository.createJob(data);
    } catch (error) {
      if (
        idempotencyKey !== undefined &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.repository.findJobByIdempotencyKey(idempotencyKey);
        if (existing !== null) return existing;
      }
      throw error;
    }
    try {
      await this.queue.enqueue(job.id, job.scheduledAt, job.priority);
      jobsSubmitted.add(1, { job_type: job.jobType });
      recordJobEnqueued(job.jobType);
      return job;
    } catch (error) {
      logger.error(
        {
          jobId: job.id,
          error: error instanceof Error ? error.message : 'unknown error',
        },
        'Failed to enqueue persisted job; starting compensation'
      );
      try {
        await this.queue.remove(job.id);
      } catch (removeError) {
        logger.warn(
          {
            jobId: job.id,
            error: removeError instanceof Error ? removeError.message : 'unknown error',
          },
          'Failed to remove possibly enqueued job from Redis during compensation'
        );
      }
      try {
        await this.repository.deleteJob(job.id);
      } catch (deleteError) {
        logger.error(
          {
            jobId: job.id,
            error: deleteError instanceof Error ? deleteError.message : 'unknown error',
          },
          'Failed to compensate PostgreSQL job after Redis scheduling failure'
        );
      }
      throw new JobSchedulingError();
    }
  }

  public findJobById(id: string): Promise<Job | null> {
    return this.repository.findJobById(id);
  }

  public async transitionJob(id: string, nextStatus: JobStatus): Promise<Job> {
    const job = await this.repository.findJobById(id);
    if (job === null) {
      throw new JobNotFoundError(id);
    }
    if (!validJobTransitions[job.status].includes(nextStatus)) {
      throw new InvalidStateTransitionError(job.status, nextStatus);
    }
    const updated = await this.repository.updateJob(id, { status: nextStatus });
    return updated;
  }

  public async cancelJob(id: string): Promise<Job> {
    const job = await this.repository.findJobById(id);
    if (job === null) {
      throw new JobNotFoundError(id);
    }
    if (!validJobTransitions[job.status].includes(JobStatus.CANCELLED)) {
      throw new InvalidStateTransitionError(job.status, JobStatus.CANCELLED);
    }
    const cancelled = await this.repository.cancelJob(id, [job.status]);
    if (cancelled === null) {
      const current = await this.repository.findJobById(id);
      if (current === null) {
        throw new JobNotFoundError(id);
      }
      throw new InvalidStateTransitionError(current.status, JobStatus.CANCELLED);
    }
    return cancelled;
  }

  public listJobs(page: number, limit: number): Promise<PaginatedJobs> {
    const options: ListJobsOptions = { limit, offset: (page - 1) * limit };
    return this.repository.listJobsPaginated(options);
  }
}
