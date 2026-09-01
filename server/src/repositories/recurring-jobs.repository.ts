import { Job, Prisma, PrismaClient, RecurringJob } from '@prisma/client';
import { prisma } from './jobs.repository.js';

export interface CreateRecurringJobInput {
  jobType: string;
  payload: object;
  cronExpression: string;
  timezone?: string;
  nextRunAt: Date;
}

export class RecurringJobsRepository {
  public constructor(private readonly client: PrismaClient) {}

  public create(input: CreateRecurringJobInput): Promise<RecurringJob> {
    return this.client.recurringJob.create({ data: input });
  }

  public findDue(now: Date): Promise<RecurringJob[]> {
    return this.client.recurringJob.findMany({
      where: { active: true, nextRunAt: { lte: now } },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  public async claimNextExecution(
    id: string,
    now: Date,
    nextRunAt: Date
  ): Promise<RecurringJob | null> {
    const claimed = await this.client.recurringJob.updateMany({
      where: { id, active: true, nextRunAt: { lte: now } },
      data: { nextRunAt },
    });
    return claimed.count === 0 ? null : this.client.recurringJob.findUnique({ where: { id } });
  }

  public createExecution(recurring: RecurringJob, scheduledAt: Date): Promise<Job> {
    return this.client.job.create({
      data: {
        jobType: recurring.jobType,
        payload: recurring.payload as Prisma.InputJsonValue,
        scheduledAt,
        recurringDefinitionId: recurring.id,
      },
    });
  }
}

export const recurringJobsRepository = new RecurringJobsRepository(prisma);
