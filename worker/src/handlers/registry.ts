import { Job } from '@prisma/client';
import pino from 'pino';

const logger = pino({ name: 'worker-handlers' });

export type JobHandler = (job: Job) => Promise<void>;

export class UnsupportedJobTypeError extends Error {
  public constructor(jobType: string) {
    super(`No implemented handler for job type '${jobType}'`);
    this.name = 'UnsupportedJobTypeError';
  }
}

const demoEmailNotificationHandler: JobHandler = async (job) => {
  logger.info({ jobId: job.id, jobType: job.jobType }, 'Demo email notification executed');
};

const placeholderHandler =
  (jobType: string): JobHandler =>
  async (job) => {
    throw new UnsupportedJobTypeError(`${jobType} (${job.jobType})`);
  };

export class JobHandlerRegistry {
  private readonly handlers = new Map<string, JobHandler>([
    ['EMAIL_NOTIFICATION', demoEmailNotificationHandler],
    ['REPORT_GENERATION', placeholderHandler('REPORT_GENERATION')],
    ['WEBHOOK', placeholderHandler('WEBHOOK')],
    ['IMAGE_PROCESSING', placeholderHandler('IMAGE_PROCESSING')],
  ]);

  public resolve(jobType: string): JobHandler | undefined {
    return this.handlers.get(jobType);
  }

  public supports(jobType: string): boolean {
    return this.handlers.has(jobType);
  }

  public supportedTypes(): string[] {
    return [...this.handlers.keys()];
  }
}
