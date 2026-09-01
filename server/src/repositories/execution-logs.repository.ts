import { ExecutionLog, ExecutionLogStatus, PrismaClient } from '@prisma/client';
import { prisma } from './jobs.repository.js';

export interface CreateExecutionLogInput {
  jobId: string;
  workerId: string;
  startedAt: Date;
}

export class ExecutionLogsRepository {
  public constructor(private readonly prisma: PrismaClient) {}

  public createAttempt(input: CreateExecutionLogInput): Promise<ExecutionLog> {
    return this.prisma.executionLog.create({ data: input });
  }

  public completeAttempt(id: string, completedAt: Date, durationMs: number): Promise<ExecutionLog> {
    return this.prisma.executionLog.update({
      where: { id },
      data: { completedAt, durationMs, status: ExecutionLogStatus.SUCCESS },
    });
  }

  public failAttempt(
    id: string,
    completedAt: Date,
    durationMs: number,
    error: string
  ): Promise<ExecutionLog> {
    return this.prisma.executionLog.update({
      where: { id },
      data: { completedAt, durationMs, status: ExecutionLogStatus.FAILED, error },
    });
  }

  public listByJobId(jobId: string): Promise<ExecutionLog[]> {
    return this.prisma.executionLog.findMany({
      where: { jobId },
      orderBy: [{ startedAt: 'asc' }, { id: 'asc' }],
    });
  }
}

export const executionLogsRepository = new ExecutionLogsRepository(prisma);
