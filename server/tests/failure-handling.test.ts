import assert from 'node:assert/strict';
import test from 'node:test';
import { Job, JobStatus } from '@prisma/client';
import { RetryCoordinator } from '../src/services/retry-coordinator.js';
import { DeadLetterService } from '../src/services/dead-letter.service.js';
import { WorkerRecoveryService } from '../../worker/src/recovery.js';

const makeJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'failure-job',
  jobType: 'REPORT_GENERATION',
  payload: {},
  status: JobStatus.RUNNING,
  priority: 0,
  scheduledAt: new Date(0),
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  processingStartedAt: new Date(0),
  idempotencyKey: null,
  recurringDefinitionId: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  ...overrides,
});

test('retry coordinator persists exponential backoff with bounded jitter and requeues', async () => {
  const updates: Record<string, unknown>[] = [];
  const queued: string[] = [];
  const repository = {
    updateJob: async (_id: string, input: Record<string, unknown>) => {
      updates.push(input);
      return makeJob(input as Partial<Job>);
    },
  };
  const queue = {
    enqueue: async (id: string) => {
      queued.push(id);
    },
  };
  const dlq = { add: async () => undefined };
  const now = new Date('2026-08-14T00:00:00.000Z');
  const coordinator = new RetryCoordinator(
    repository as never,
    queue as never,
    dlq as never,
    { baseDelayMs: 1000, jitterMs: 200 },
    () => now,
    () => 0.5
  );
  const disposition = await coordinator.handleFailure(
    makeJob({ retryCount: 1 }),
    'temporary failure'
  );
  assert.equal(disposition, 'RETRIED');
  assert.equal(updates[0].retryCount, 2);
  assert.equal(updates[0].lastError, 'temporary failure');
  assert.equal((updates[0].scheduledAt as Date).getTime(), now.getTime() + 4_100);
  assert.equal(updates[0].status, JobStatus.PENDING);
  assert.deepEqual(queued, ['failure-job']);
});

test('retry coordinator dead-letters a job after maximum retries', async () => {
  const updates: Record<string, unknown>[] = [];
  const dead: string[] = [];
  const repository = {
    updateJob: async (_id: string, input: Record<string, unknown>) => {
      updates.push(input);
      return makeJob(input as Partial<Job>);
    },
  };
  const queue = {
    enqueue: async () => {
      throw new Error('must not enqueue');
    },
  };
  const dlq = {
    add: async (id: string) => {
      dead.push(id);
    },
  };
  const coordinator = new RetryCoordinator(repository as never, queue as never, dlq as never, {
    baseDelayMs: 1,
    jitterMs: 0,
  });
  assert.equal(await coordinator.handleFailure(makeJob({ retryCount: 3 }), 'final failure'), 'DLQ');
  assert.equal(updates[0].status, JobStatus.FAILED);
  assert.equal(updates[0].retryCount, 4);
  assert.deepEqual(dead, ['failure-job']);
});

test('DLQ replay resets state and schedules one member safely', async () => {
  const queued: string[] = [];
  const removed: string[] = [];
  const job = makeJob({ status: JobStatus.FAILED, retryCount: 4, lastError: 'final' });
  const repository = {
    findJobById: async () => job,
    retryJob: async () => makeJob({ status: JobStatus.PENDING, retryCount: 0, lastError: null }),
  };
  const dlq = {
    remove: async (id: string) => {
      removed.push(id);
    },
    list: async () => [],
  };
  const queue = {
    enqueue: async (id: string) => {
      queued.push(id);
    },
  };
  const replayed = await new DeadLetterService(
    repository as never,
    dlq as never,
    queue as never
  ).replay(job.id);
  assert.equal(replayed.status, JobStatus.PENDING);
  assert.deepEqual(removed, [job.id]);
  assert.deepEqual(queued, [job.id]);
});

test('recovery only requeues running jobs whose lease expired and lock is gone', async () => {
  const recovered: string[] = [];
  const queued: string[] = [];
  const repository = {
    listStaleProcessing: async () => [makeJob({ id: 'stale' }), makeJob({ id: 'slow' })],
    recoverStaleJob: async (id: string) => {
      recovered.push(id);
      return makeJob({ id, status: JobStatus.PENDING });
    },
  };
  const redis = { getValue: async (key: string) => (key.endsWith('slow') ? 'worker-live' : null) };
  const queue = {
    enqueue: async (id: string) => {
      queued.push(id);
    },
  };
  const service = new WorkerRecoveryService(
    repository as never,
    queue as never,
    redis as never,
    1_000
  );
  assert.equal(await service.recoverStaleJobs(new Date(2_000)), 1);
  assert.deepEqual(recovered, ['stale']);
  assert.deepEqual(queued, ['stale']);
});
