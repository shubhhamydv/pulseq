import assert from 'node:assert/strict';
import test from 'node:test';
import { Worker } from '../src/worker.js';

test('worker polling requests due IDs and processes each returned job', async () => {
  const calls: string[] = [];
  const queue = {
    getDueJobs: async (limit: number) => {
      calls.push(`getDueJobs:${limit}`);
      return ['job-a', 'job-b'];
    },
  };
  const executor = {
    processJobId: async (jobId: string) => {
      calls.push(`process:${jobId}`);
    },
  };
  const worker = new Worker(queue as never, executor as never, 1, 2);
  assert.equal(await worker.pollOnce(), 2);
  assert.deepEqual(calls, ['getDueJobs:2', 'process:job-a', 'process:job-b']);
});

test('worker enforces the configured concurrency ceiling', async () => {
  let active = 0;
  let maximum = 0;
  const completed: string[] = [];
  const queue = { getDueJobs: async () => ['a', 'b', 'c', 'd', 'e'] };
  const executor = {
    processJobId: async (jobId: string) => {
      active += 1;
      maximum = Math.max(maximum, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      completed.push(jobId);
    },
  };
  const worker = new Worker(queue as never, executor as never, 1, 3, 10);
  assert.equal(await worker.pollOnce(), 3);
  await worker.waitForIdle();
  assert.equal(maximum, 3);
  assert.deepEqual(completed.sort(), ['a', 'b', 'c']);
});

test('worker polling continues after one job failure', async () => {
  const processed: string[] = [];
  const queue = { getDueJobs: async () => ['job-failed', 'job-ok'] };
  const executor = {
    processJobId: async (jobId: string) => {
      processed.push(jobId);
      if (jobId === 'job-failed') throw new Error('demo failure');
    },
  };
  const worker = new Worker(queue as never, executor as never, 1, 10);
  assert.equal(await worker.pollOnce(), 2);
  assert.deepEqual(processed, ['job-failed', 'job-ok']);
});
