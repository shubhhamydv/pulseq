import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { JobLockService, jobLockKey } from '../src/infrastructure/redis/job-lock.service.js';
import { redisService } from '../src/infrastructure/redis/redis.service.js';

test('distributed job lock enforces ownership and expires', async () => {
  assert.equal(await redisService.ping(), true);
  const jobId = `lock-test-${Date.now()}`;
  const owner = new JobLockService(redisService, 'worker-a', 100);
  const other = new JobLockService(redisService, 'worker-b', 100);
  await redisService.deleteIfValueMatches(jobLockKey(jobId), 'worker-a');
  assert.equal(await owner.acquireLock(jobId), true);
  assert.equal(await other.acquireLock(jobId), false);
  assert.equal(await other.releaseLock(jobId), false);
  assert.equal(await owner.releaseLock(jobId), true);
  assert.equal(await owner.releaseLock(jobId), false);
  assert.equal(await owner.acquireLock(jobId), true);
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(await other.acquireLock(jobId), true);
  await other.releaseLock(jobId);
});

test('exactly one of five workers acquires the same job lock', async () => {
  const jobId = `five-worker-${Date.now()}`;
  const workers = Array.from(
    { length: 5 },
    (_, index) => new JobLockService(redisService, `worker-${index}`, 1_000)
  );
  const acquired = await Promise.all(workers.map((worker) => worker.acquireLock(jobId)));
  assert.equal(acquired.filter(Boolean).length, 1);
  const winner = workers[acquired.findIndex(Boolean)];
  await winner.releaseLock(jobId);
});

after(async () => {
  await redisService.disconnect();
});
