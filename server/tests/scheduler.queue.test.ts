import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import { RedisService } from '../src/infrastructure/redis/redis.service.js';
import { SCHEDULED_JOBS_KEY, SchedulerQueue } from '../src/infrastructure/redis/scheduler.queue.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const redis = new RedisService(redisUrl);
const queue = new SchedulerQueue(redis);

test('scheduler queue integration', { skip: !redisUrl }, async (suite) => {
  before(async () => {
    assert.equal(await redis.ping(), true);
  });

  beforeEach(async () => {
    await redis.clearKey(SCHEDULED_JOBS_KEY);
  });

  after(async () => {
    await redis.clearKey(SCHEDULED_JOBS_KEY);
    await redis.disconnect();
  });

  await suite.test('enqueue stores the job ID and millisecond score', async () => {
    const scheduledAt = new Date('2026-08-14T12:00:00.000Z');
    await queue.enqueue('job-score', scheduledAt);
    assert.equal(
      await redis.getSortedSetScore(SCHEDULED_JOBS_KEY, 'job-score'),
      scheduledAt.getTime()
    );
  });

  await suite.test('re-enqueueing a job updates one existing member', async () => {
    const now = Date.now();
    await queue.enqueue('job-duplicate', now + 60_000);
    await queue.enqueue('job-duplicate', now + 120_000);
    assert.deepEqual(await queue.getDueJobs(10), []);
    assert.equal(await redis.getSortedSetScore(SCHEDULED_JOBS_KEY, 'job-duplicate'), now + 120_000);
  });

  await suite.test(
    'getDueJobs returns due jobs in schedule order and respects the limit',
    async () => {
      const now = Date.now();
      await queue.enqueue('job-later-due', now - 100);
      await queue.enqueue('job-earlier-due', now - 200);
      await queue.enqueue('job-now', now);
      await queue.enqueue('job-future', now + 60_000);

      assert.deepEqual(await queue.getDueJobs(2), ['job-earlier-due', 'job-later-due']);
      assert.deepEqual(await queue.getDueJobs(10), ['job-earlier-due', 'job-later-due', 'job-now']);
    }
  );

  await suite.test('remove is safe for existing and absent members', async () => {
    await queue.enqueue('job-remove', Date.now() - 1_000);
    await queue.remove('job-remove');
    await queue.remove('job-absent');
    assert.deepEqual(await queue.getDueJobs(10), []);
  });

  await suite.test('queue inputs are validated', async () => {
    await assert.rejects(() => queue.enqueue('', Date.now()), TypeError);
    await assert.rejects(() => queue.enqueue('bad-date', 'not-a-date'), TypeError);
    await assert.rejects(() => queue.getDueJobs(0), RangeError);
    await assert.rejects(() => queue.getDueJobs(101), RangeError);
    await assert.rejects(() => queue.remove(''), TypeError);
  });
});
