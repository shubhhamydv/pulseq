import { ExecutionLog } from '@prisma/client';
import { ExecutionLogsRepository } from '../repositories/execution-logs.repository.js';
import { JobsRepository } from '../repositories/jobs.repository.js';

export class ExecutionLogsService {
  public constructor(
    private readonly jobs: JobsRepository,
    private readonly logs: ExecutionLogsRepository
  ) {}

  public async listForJob(jobId: string): Promise<ExecutionLog[]> {
    if ((await this.jobs.findJobById(jobId)) === null) return [];
    return this.logs.listByJobId(jobId);
  }

  public async jobExists(jobId: string): Promise<boolean> {
    return (await this.jobs.findJobById(jobId)) !== null;
  }
}
