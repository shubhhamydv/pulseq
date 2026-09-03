import { Job, JobStatus } from '@prisma/client';
import { context, propagation, SpanKind, trace } from '@opentelemetry/api';
import { childLogger, errorFields } from '../../server/src/observability/logger.js';
import { recordException, tracer } from '../../server/src/observability/tracing.js';
import { JobsRepository } from '../../server/src/repositories/jobs.repository.js';
import { SchedulerQueue } from '../../server/src/infrastructure/redis/scheduler.queue.js';
import { JobHandlerRegistry } from './handlers/registry.js';
import { RetryCoordinator, retryCoordinator } from '../../server/src/services/retry-coordinator.js';
import {
  executionLatency,
  jobsCompleted,
  jobsFailed,
  jobsRetried,
  lockAcquisitionFailures,
  recordJobFailed,
  recordJobProcessed,
} from '../../server/src/observability/metrics.js';

const logger = childLogger({ event: 'worker.executor' });

export interface LockOwner {
  acquireLock(jobId: string): Promise<boolean>;
  releaseLock(jobId: string): Promise<boolean>;
}

export interface ExecutionLogStore {
  createAttempt(input: {
    jobId: string;
    workerId: string;
    startedAt: Date;
  }): Promise<{ id: string }>;
  completeAttempt(id: string, completedAt: Date, durationMs: number): Promise<unknown>;
  failAttempt(id: string, completedAt: Date, durationMs: number, error: string): Promise<unknown>;
}

export class WorkerExecutor {
  public constructor(
    private readonly repository: JobsRepository,
    private readonly queue: SchedulerQueue,
    private readonly registry: JobHandlerRegistry,
    private readonly lockService: LockOwner,
    private readonly executionLogs: ExecutionLogStore,
    private readonly workerId: string,
    private readonly retries: RetryCoordinator = retryCoordinator
  ) {}

  public async processJobId(jobId: string): Promise<void> {
    const acquired = await this.lockService.acquireLock(jobId);
    if (!acquired) {
      lockAcquisitionFailures.add(1);
      logger.info({ jobId, workerId: this.workerId }, 'Job lock is held by another worker');
      return;
    }

    try {
      await this.queue.remove(jobId);
      const job = await this.repository.findJobById(jobId);
      if (job === null) {
        logger.warn(
          { jobId, workerId: this.workerId },
          'Scheduled job no longer exists in PostgreSQL'
        );
        return;
      }

      const claimedJob = await this.repository.claimJob(jobId);
      if (claimedJob === null) {
        logger.info(
          { jobId, workerId: this.workerId },
          'Job was already claimed by another worker'
        );
        return;
      }
      const carrier: Record<string, string> = {};
      if (claimedJob.traceparent) carrier.traceparent = claimedJob.traceparent;
      if (claimedJob.tracestate) carrier.tracestate = claimedJob.tracestate;
      const parentContext = propagation.extract(context.active(), carrier);
      const span = tracer.startSpan(
        'pulseq.worker.process',
        {
          kind: SpanKind.CONSUMER,
          attributes: {
            'pulseq.job.id': claimedJob.id,
            'pulseq.job.type': claimedJob.jobType,
            'pulseq.worker.id': this.workerId,
          },
        },
        parentContext
      );
      try {
        await context.with(trace.setSpan(parentContext, span), () =>
          this.executeClaimedJob(claimedJob)
        );
      } catch (error) {
        recordException(span, error);
        throw error;
      } finally {
        span.end();
      }
    } finally {
      await this.lockService.releaseLock(jobId);
    }
  }

  private async executeClaimedJob(job: Job): Promise<void> {
    const startedAt = new Date();
    const attempt = await this.executionLogs.createAttempt({
      jobId: job.id,
      workerId: this.workerId,
      startedAt,
    });
    const handler = this.registry.resolve(job.jobType);

    if (handler === undefined) {
      const errorMessage = `No implemented handler for job type '${job.jobType}'`;
      await this.finishFailedAttempt(job, attempt.id, startedAt, errorMessage);
      return;
    }

    logger.info(
      {
        jobId: job.id,
        workerId: this.workerId,
        jobType: job.jobType,
        attempt: job.retryCount + 1,
        event: 'job.started',
      },
      'Job execution started'
    );

    try {
      await handler(job);
      await this.repository.updateJob(job.id, {
        status: JobStatus.COMPLETED,
        lastError: null,
        processingStartedAt: null,
      });
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      await this.executionLogs.completeAttempt(attempt.id, completedAt, durationMs);
      jobsCompleted.add(1, { job_type: job.jobType });
      executionLatency.observe(durationMs / 1000, { job_type: job.jobType });
      recordJobProcessed(job.jobType, durationMs / 1000);
      logger.info(
        {
          jobId: job.id,
          workerId: this.workerId,
          jobType: job.jobType,
          attempt: job.retryCount + 1,
          duration: durationMs,
          status: 'completed',
        },
        'Job execution completed'
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown handler error';
      await this.finishFailedAttempt(job, attempt.id, startedAt, errorMessage);
    }
  }

  private async finishFailedAttempt(
    job: Job,
    attemptId: string,
    startedAt: Date,
    errorMessage: string
  ): Promise<void> {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const disposition = await this.retries.handleFailure(job, errorMessage);
    await this.executionLogs.failAttempt(attemptId, completedAt, durationMs, errorMessage);
    jobsFailed.add(1, { job_type: job.jobType });
    if (disposition === 'RETRIED') jobsRetried.add(1, { job_type: job.jobType });
    executionLatency.observe(durationMs / 1000, { job_type: job.jobType });
    recordJobFailed(
      job.jobType,
      durationMs / 1000,
      disposition === 'RETRIED' ? 'retrying' : 'failed'
    );
    logger.error(
      {
        jobId: job.id,
        workerId: this.workerId,
        jobType: job.jobType,
        attempt: job.retryCount + 1,
        duration: durationMs,
        status: disposition === 'RETRIED' ? 'retrying' : 'failed',
        ...errorFields(new Error(errorMessage)),
        event: disposition === 'RETRIED' ? 'job.retried' : 'job.failed',
      },
      'Job execution failed'
    );
  }
}
