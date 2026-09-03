import { redisService, RedisService } from './redis.service.js';

export const DLQ_KEY = 'jobs:dlq';

export class DeadLetterQueue {
  public constructor(private readonly redis: RedisService) {}

  public add(jobId: string): Promise<void> {
    return this.redis.addToSet(DLQ_KEY, jobId);
  }

  public list(): Promise<string[]> {
    return this.redis.getSetMembers(DLQ_KEY);
  }

  public remove(jobId: string): Promise<void> {
    return this.redis.removeFromSet(DLQ_KEY, jobId);
  }
}

export const deadLetterQueue = new DeadLetterQueue(redisService);
