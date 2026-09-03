import { redisService, RedisService } from './redis.service.js';

export const jobLockKey = (jobId: string): string => `lock:job:${jobId}`;

export class JobLockService {
  public constructor(
    private readonly redis: RedisService,
    private readonly workerId: string,
    private readonly ttlMs = 30_000
  ) {
    if (workerId.trim().length === 0) throw new TypeError('workerId must be non-empty');
    if (!Number.isInteger(ttlMs) || ttlMs <= 0)
      throw new RangeError('lock TTL must be a positive integer');
  }

  public async acquireLock(jobId: string): Promise<boolean> {
    if (jobId.trim().length === 0) throw new TypeError('jobId must be non-empty');
    return this.redis.setIfAbsent(jobLockKey(jobId), this.workerId, this.ttlMs);
  }

  public async releaseLock(jobId: string): Promise<boolean> {
    if (jobId.trim().length === 0) throw new TypeError('jobId must be non-empty');
    return this.redis.deleteIfValueMatches(jobLockKey(jobId), this.workerId);
  }

  public getWorkerId(): string {
    return this.workerId;
  }
}

export const createJobLockService = (
  workerId: string,
  ttlMs = Number(process.env.WORKER_LOCK_TTL_MS ?? 30_000)
): JobLockService => new JobLockService(redisService, workerId, ttlMs);
