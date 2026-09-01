import { PrismaClient, Prisma, Job, JobStatus } from '@prisma/client';
import { withSpan } from '../observability/tracing.js';

export interface CreateJobInput {
  jobType: string;
  payload: Prisma.InputJsonValue;
  status?: JobStatus;
  priority?: number;
  scheduledAt?: Date;
  retryCount?: number;
  maxRetries?: number;
  lastError?: string | null;
  processingStartedAt?: Date | null;
  idempotencyKey?: string | null;
  requestId?: string | null;
  traceparent?: string | null;
  tracestate?: string | null;
}

export interface ListJobsOptions {
  status?: JobStatus;
  priority?: number;
  scheduledBefore?: Date;
  scheduledAfter?: Date;
  limit?: number;
  offset?: number;
}

export interface PaginatedJobs {
  jobs: Job[];
  total: number;
}

export interface UpdateJobInput {
  jobType?: string;
  payload?: Prisma.InputJsonValue;
  status?: JobStatus;
  priority?: number;
  scheduledAt?: Date;
  retryCount?: number;
  maxRetries?: number;
  lastError?: string | null;
  processingStartedAt?: Date | null;
}

export class JobsRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public createJob(input: CreateJobInput): Promise<Job> {
    return withSpan(
      'pulseq.db.job.create',
      { 'db.system': 'postgresql', 'db.operation.name': 'INSERT' },
      () => this.prisma.job.create({ data: input })
    );
  }

  public findJobById(id: string): Promise<Job | null> {
    return this.prisma.job.findUnique({ where: { id } });
  }

  public findJobByIdempotencyKey(idempotencyKey: string): Promise<Job | null> {
    return this.prisma.job.findUnique({ where: { idempotencyKey } });
  }

  public deleteJob(id: string): Promise<Job> {
    return this.prisma.job.delete({ where: { id } });
  }

  public listJobs(options: ListJobsOptions = {}): Promise<Job[]> {
    const { status, priority, scheduledBefore, scheduledAfter, limit, offset } = options;
    return this.prisma.job.findMany({
      where: {
        ...(status === undefined ? {} : { status }),
        ...(priority === undefined ? {} : { priority }),
        ...(scheduledBefore === undefined && scheduledAfter === undefined
          ? {}
          : {
              scheduledAt: {
                ...(scheduledBefore === undefined ? {} : { lte: scheduledBefore }),
                ...(scheduledAfter === undefined ? {} : { gte: scheduledAfter }),
              },
            }),
      },
      orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
      ...(limit === undefined ? {} : { take: limit }),
      ...(offset === undefined ? {} : { skip: offset }),
    });
  }

  public async listJobsPaginated(options: ListJobsOptions = {}): Promise<PaginatedJobs> {
    const { status, priority, scheduledBefore, scheduledAfter, limit = 20, offset = 0 } = options;
    const where: Prisma.JobWhereInput = {
      ...(status === undefined ? {} : { status }),
      ...(priority === undefined ? {} : { priority }),
      ...(scheduledBefore === undefined && scheduledAfter === undefined
        ? {}
        : {
            scheduledAt: {
              ...(scheduledBefore === undefined ? {} : { lte: scheduledBefore }),
              ...(scheduledAfter === undefined ? {} : { gte: scheduledAfter }),
            },
          }),
    };
    const [jobs, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { scheduledAt: 'asc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.job.count({ where }),
    ]);
    return { jobs, total };
  }

  public updateJob(id: string, input: UpdateJobInput): Promise<Job> {
    return withSpan(
      'pulseq.db.job.update',
      { 'db.system': 'postgresql', 'db.operation.name': 'UPDATE', 'pulseq.job.id': id },
      () => this.prisma.job.update({ where: { id }, data: input })
    );
  }

  public async claimJob(id: string): Promise<Job | null> {
    return withSpan(
      'pulseq.db.job.claim',
      { 'db.system': 'postgresql', 'db.operation.name': 'UPDATE', 'pulseq.job.id': id },
      async () => {
        const claimed = await this.prisma.job.updateMany({
          where: { id, status: JobStatus.PENDING },
          data: { status: JobStatus.RUNNING },
        });
        return claimed.count === 0 ? null : this.findJobById(id);
      }
    );
  }

  public async retryJob(id: string, scheduledAt: Date): Promise<Job | null> {
    const updated = await this.prisma.job.updateMany({
      where: { id, status: JobStatus.FAILED },
      data: {
        status: JobStatus.PENDING,
        retryCount: 0,
        lastError: null,
        scheduledAt,
        processingStartedAt: null,
      },
    });
    return updated.count === 0 ? null : this.findJobById(id);
  }

  public listStaleProcessing(before: Date): Promise<Job[]> {
    return this.prisma.job.findMany({
      where: { status: JobStatus.RUNNING, processingStartedAt: { lte: before } },
    });
  }

  public async recoverStaleJob(id: string, scheduledAt: Date): Promise<Job | null> {
    const updated = await this.prisma.job.updateMany({
      where: { id, status: JobStatus.RUNNING },
      data: { status: JobStatus.PENDING, scheduledAt, processingStartedAt: null },
    });
    return updated.count === 0 ? null : this.findJobById(id);
  }

  public async cancelJob(
    id: string,
    expectedStatuses: JobStatus[] = [JobStatus.PENDING, JobStatus.RUNNING]
  ): Promise<Job | null> {
    const updated = await this.prisma.job.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data: { status: JobStatus.CANCELLED },
    });
    return updated.count === 0 ? null : this.findJobById(id);
  }
}

export const prisma = new PrismaClient();
export const jobsRepository = new JobsRepository(prisma);
