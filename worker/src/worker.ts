import pino from 'pino';
import { SchedulerQueue } from '../../server/src/infrastructure/redis/scheduler.queue.js';
import { WorkerExecutor } from './worker.executor.js';

const logger = pino({ name: 'worker' });

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export interface RecoveryProcess {
  recoverStaleJobs(): Promise<number>;
}

export class Worker {
  private running = false;
  private readonly inFlight = new Set<Promise<void>>();

  public constructor(
    private readonly queue: SchedulerQueue,
    private readonly executor: WorkerExecutor,
    private readonly pollIntervalMs = 1_000,
    private readonly concurrency = 10,
    private readonly batchLimit = 10,
    private readonly recovery?: RecoveryProcess
  ) {}

  public async pollOnce(): Promise<number> {
    await this.recovery?.recoverStaleJobs();
    const available = this.concurrency - this.inFlight.size;
    if (available <= 0) return 0;
    const jobIds = await this.queue.getDueJobs(Math.min(available, this.batchLimit));
    const selectedJobIds = jobIds.slice(0, available);
    if (selectedJobIds.length > 0) logger.info({ count: selectedJobIds.length }, 'Due jobs found');
    for (const jobId of selectedJobIds) this.startJob(jobId);
    return selectedJobIds.length;
  }

  private startJob(jobId: string): void {
    const task = this.executor
      .processJobId(jobId)
      .catch((error: unknown) => {
        logger.error(
          { jobId, error: error instanceof Error ? error.message : 'unknown error' },
          'Worker failed to process job; continuing polling'
        );
      })
      .finally(() => {
        this.inFlight.delete(task);
      });
    this.inFlight.add(task);
  }

  public async waitForIdle(): Promise<void> {
    while (this.inFlight.size > 0) await Promise.all([...this.inFlight]);
  }

  public async run(): Promise<void> {
    this.running = true;
    logger.info({ concurrency: this.concurrency }, 'Worker polling started');
    while (this.running) {
      try {
        await this.pollOnce();
      } catch (error) {
        logger.error(
          { error: error instanceof Error ? error.message : 'unknown error' },
          'Worker polling failed; retrying'
        );
      }
      if (this.running) await wait(this.pollIntervalMs);
    }
    await this.waitForIdle();
    logger.info('Worker polling stopped');
  }

  public stop(): void {
    this.running = false;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public activeCount(): number {
    return this.inFlight.size;
  }
}
