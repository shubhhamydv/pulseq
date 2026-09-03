import Redis from 'ioredis';
import pino from 'pino';

const logger = pino({ name: 'redis' });

export class RedisService {
  private readonly client: Redis;
  private connectionPromise: Promise<void> | null = null;

  public constructor(url = process.env.REDIS_URL ?? 'redis://localhost:6379') {
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 1_000,
      retryStrategy: (attempt) => Math.min(attempt * 200, 5_000),
    });

    this.client.on('connect', () => logger.info('Redis connection established'));
    this.client.on('ready', () => logger.info('Redis client ready'));
    this.client.on('reconnecting', (delay: number) => logger.warn({ delay }, 'Redis reconnecting'));
    this.client.on('close', () => logger.warn('Redis connection closed'));
    this.client.on('error', (error: Error) =>
      logger.error({ error: error.message }, 'Redis connection error')
    );
  }

  public async connect(): Promise<void> {
    if (this.client.status === 'ready' || this.client.status === 'connecting') {
      return this.connectionPromise ?? Promise.resolve();
    }
    this.connectionPromise ??= this.client.connect().finally(() => {
      this.connectionPromise = null;
    });
    return this.connectionPromise;
  }

  public async ping(timeoutMs = 1_000): Promise<boolean> {
    try {
      await Promise.race([
        this.connect().then(() => this.client.ping()),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Redis health check timed out')), timeoutMs).unref();
        }),
      ]);
      return true;
    } catch (error) {
      logger.warn(
        { error: error instanceof Error ? error.message : 'unknown error' },
        'Redis health check failed'
      );
      return false;
    }
  }

  public async addToSet(key: string, member: string): Promise<void> {
    await this.connect();
    await this.client.sadd(key, member);
  }

  public async getSetMembers(key: string): Promise<string[]> {
    await this.connect();
    return this.client.smembers(key);
  }

  public async removeFromSet(key: string, member: string): Promise<void> {
    await this.connect();
    await this.client.srem(key, member);
  }

  public async setHashValue(key: string, field: string, value: string): Promise<void> {
    await this.connect();
    await this.client.hset(key, field, value);
  }

  public async getHashValues(key: string, fields: string[]): Promise<(string | null)[]> {
    await this.connect();
    if (fields.length === 0) return [];
    return this.client.hmget(key, ...fields);
  }

  public async removeHashValue(key: string, field: string): Promise<void> {
    await this.connect();
    await this.client.hdel(key, field);
  }

  public async setIfAbsent(key: string, value: string, ttlMs: number): Promise<boolean> {
    await this.connect();
    const result = await this.client.set(key, value, 'PX', ttlMs, 'NX');
    return result === 'OK';
  }

  public async getValue(key: string): Promise<string | null> {
    await this.connect();
    return this.client.get(key);
  }

  public async deleteIfValueMatches(key: string, expectedValue: string): Promise<boolean> {
    await this.connect();
    const script =
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    const deleted = await this.client.eval(script, 1, key, expectedValue);
    return Number(deleted) === 1;
  }

  public async addToSortedSet(key: string, score: number, member: string): Promise<void> {
    await this.connect();
    await this.client.zadd(key, score, member);
  }

  public async getSortedSetMembersByScore(
    key: string,
    maxScore: number,
    limit: number
  ): Promise<string[]> {
    await this.connect();
    return this.client.zrangebyscore(key, '-inf', maxScore, 'LIMIT', 0, limit);
  }

  public async removeFromSortedSet(key: string, member: string): Promise<void> {
    await this.connect();
    await this.client.zrem(key, member);
  }

  public async getSortedSetSize(key: string): Promise<number> {
    await this.connect();
    return this.client.zcard(key);
  }

  public async getSetSize(key: string): Promise<number> {
    await this.connect();
    return this.client.scard(key);
  }

  public async getHash(key: string): Promise<Record<string, string>> {
    await this.connect();
    return this.client.hgetall(key);
  }

  public async setHash(key: string, values: Record<string, string>): Promise<void> {
    await this.connect();
    await this.client.hset(key, values);
  }

  public async clearKey(key: string): Promise<void> {
    await this.connect();
    await this.client.del(key);
  }

  public async getSortedSetScore(key: string, member: string): Promise<number | null> {
    await this.connect();
    const score = await this.client.zscore(key, member);
    return score === null ? null : Number(score);
  }

  public async disconnect(): Promise<void> {
    if (this.client.status === 'end') return;
    logger.info('Closing Redis connection');
    if (this.client.status === 'ready') {
      await this.client.quit();
    } else {
      this.client.disconnect();
    }
  }
}

export const redisService = new RedisService();
