import { redisService, RedisService } from './redis.service.js';

export const SCHEDULED_JOBS_KEY = 'jobs:scheduled';
export const JOB_PRIORITY_KEY = 'jobs:priority';
const MAX_LIMIT = 100;

export type ScheduledAt = Date | string | number;

const toTimestampMs = (scheduledAt: ScheduledAt): number => {
  const timestamp =
    scheduledAt instanceof Date ? scheduledAt.getTime() : new Date(scheduledAt).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new TypeError('scheduledAt must represent a valid date/time');
  }
  return timestamp;
};

const validateJobId = (jobId: string): void => {
  if (typeof jobId !== 'string' || jobId.trim().length === 0) {
    throw new TypeError('jobId must be a non-empty string');
  }
};

const validateLimit = (limit: number): void => {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new RangeError(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
};

export class SchedulerQueue {
  public constructor(private readonly redis: RedisService) {}

  public async enqueue(jobId: string, scheduledAt: ScheduledAt, priority = 0): Promise<void> {
    validateJobId(jobId);
    const scheduledAtMs = toTimestampMs(scheduledAt);
    await this.redis.addToSortedSet(SCHEDULED_JOBS_KEY, scheduledAtMs, jobId);
    await this.redis.setHashValue(JOB_PRIORITY_KEY, jobId, String(priority));
  }

  public async getDueJobs(limit: number): Promise<string[]> {
    validateLimit(limit);
    const candidates = await this.redis.getSortedSetMembersByScore(
      SCHEDULED_JOBS_KEY,
      Date.now(),
      100
    );
    const priorities = await this.redis.getHashValues(JOB_PRIORITY_KEY, candidates);
    const scores = await Promise.all(
      candidates.map((jobId) => this.redis.getSortedSetScore(SCHEDULED_JOBS_KEY, jobId))
    );
    return candidates
      .map((jobId, index) => ({
        jobId,
        priority: Number(priorities[index] ?? 0),
        score: scores[index] ?? Number.MAX_SAFE_INTEGER,
      }))
      .sort(
        (a, b) => b.priority - a.priority || a.score - b.score || a.jobId.localeCompare(b.jobId)
      )
      .slice(0, limit)
      .map(({ jobId }) => jobId);
  }

  public async remove(jobId: string): Promise<void> {
    validateJobId(jobId);
    await this.redis.removeFromSortedSet(SCHEDULED_JOBS_KEY, jobId);
    await this.redis.removeHashValue(JOB_PRIORITY_KEY, jobId);
  }
}

export const schedulerQueue = new SchedulerQueue(redisService);
