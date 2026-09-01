import parser from 'cron-parser';
import pino from 'pino';
import { JobLockService } from '../infrastructure/redis/job-lock.service.js';
import { SchedulerQueue } from '../infrastructure/redis/scheduler.queue.js';
import { RecurringJobsRepository } from '../repositories/recurring-jobs.repository.js';

const logger = pino({ name: 'recurring-scheduler' });

export const validateCronExpression = (expression: string): void => {
  try {
    parser.parseExpression(expression);
  } catch {
    throw new TypeError('cronExpression must be a valid cron expression');
  }
};

export const nextCronRun = (expression: string, currentDate: Date, tz = 'UTC'): Date => {
  validateCronExpression(expression);
  return parser.parseExpression(expression, { currentDate, tz }).next().toDate();
};

export class RecurringSchedulerService {
  public constructor(
    private readonly repository: RecurringJobsRepository,
    private readonly queue: SchedulerQueue,
    private readonly locks: JobLockService
  ) {}

  public async runOnce(now = new Date()): Promise<number> {
    const due = await this.repository.findDue(now);
    let generated = 0;
    for (const definition of due) {
      if (!(await this.locks.acquireLock(`recurring:${definition.id}`))) continue;
      try {
        const nextRunAt = nextCronRun(definition.cronExpression, now, definition.timezone);
        const claimed = await this.repository.claimNextExecution(definition.id, now, nextRunAt);
        if (claimed === null) continue;
        const execution = await this.repository.createExecution(definition, now);
        await this.queue.enqueue(execution.id, execution.scheduledAt, execution.priority);
        generated += 1;
      } catch (error) {
        logger.error(
          {
            recurringJobId: definition.id,
            error: error instanceof Error ? error.message : 'unknown error',
          },
          'Recurring generation failed'
        );
      } finally {
        await this.locks.releaseLock(`recurring:${definition.id}`);
      }
    }
    return generated;
  }
}
