import assert from 'node:assert/strict';
import test from 'node:test';
import { JobStatus } from '@prisma/client';
import { JobSchedulingError, JobsService } from '../src/services/jobs.service.js';

const persistedJob = {
  id: 'pipeline-job',
  jobType: 'pipeline.test',
  payload: {},
  status: JobStatus.PENDING,
  priority: 0,
  scheduledAt: new Date('2026-08-14T12:00:00.000Z'),
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

test('job creation pipeline schedules after PostgreSQL persistence', async () => {
  const calls: string[] = [];
  const repository = {
    createJob: async () => {
      calls.push('postgres.create');
      return persistedJob;
    },
    deleteJob: async () => persistedJob,
  };
  const queue = {
    enqueue: async (id: string, scheduledAt: Date) => {
      calls.push(`redis.enqueue:${id}:${scheduledAt.getTime()}`);
    },
    remove: async () => {
      calls.push('redis.remove');
    },
  };

  const created = await new JobsService(repository as never, queue as never).createJob({
    jobType: 'pipeline.test',
    payload: {},
  });
  assert.equal(created.id, persistedJob.id);
  assert.deepEqual(calls, [
    'postgres.create',
    `redis.enqueue:pipeline-job:${persistedJob.scheduledAt.getTime()}`,
  ]);
});

test('Redis scheduling failure returns an error and compensates PostgreSQL', async () => {
  const calls: string[] = [];
  const repository = {
    createJob: async () => persistedJob,
    deleteJob: async () => {
      calls.push('postgres.delete');
      return persistedJob;
    },
  };
  const queue = {
    enqueue: async () => {
      calls.push('redis.enqueue');
      throw new Error('redis unavailable');
    },
    remove: async () => {
      calls.push('redis.remove');
    },
  };

  await assert.rejects(
    () =>
      new JobsService(repository as never, queue as never).createJob({
        jobType: 'pipeline.test',
        payload: {},
      }),
    (error: unknown) => error instanceof JobSchedulingError
  );
  assert.deepEqual(calls, ['redis.enqueue', 'redis.remove', 'postgres.delete']);
});

test('PostgreSQL failure prevents Redis scheduling', async () => {
  let enqueueCalled = false;
  const repository = {
    createJob: async () => {
      throw new Error('postgres unavailable');
    },
  };
  const queue = {
    enqueue: async () => {
      enqueueCalled = true;
    },
  };

  await assert.rejects(
    () =>
      new JobsService(repository as never, queue as never).createJob({
        jobType: 'pipeline.test',
        payload: {},
      }),
    /postgres unavailable/
  );
  assert.equal(enqueueCalled, false);
});
