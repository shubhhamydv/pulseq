import assert from 'node:assert/strict';
import test from 'node:test';
import {
  RecurringSchedulerService,
  nextCronRun,
  validateCronExpression,
} from '../src/services/recurring-scheduler.service.js';

const definition = {
  id: 'recurring-1',
  name: 'hourly report',
  cronExpression: '0 * * * *',
  jobType: 'REPORT_GENERATION',
  payload: {},
  priority: 25,
  maxRetries: 3,
  timezone: 'UTC',
  enabled: true,
  nextRunAt: new Date('2026-08-14T10:00:00.000Z'),
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const now = new Date('2026-08-14T10:00:00.000Z');

test('cron validation and next-run calculation are deterministic', () => {
  validateCronExpression('*/15 * * * *');
  assert.throws(() => validateCronExpression('not cron'), /valid cron expression/);
  assert.equal(nextCronRun('0 * * * *', now).toISOString(), '2026-08-14T11:00:00.000Z');
});

test('scheduler creates one prioritized execution after an atomic claim', async () => {
  const calls: string[] = [];
  const repository = {
    findDue: async () => [definition],
    claimNextExecution: async (id: string, dueAt: Date, nextRunAt: Date) => {
      calls.push(`claim:${id}:${dueAt.toISOString()}:${nextRunAt.toISOString()}`);
      return definition;
    },
    createExecution: async () => ({ id: 'job-1', scheduledAt: now, priority: 25 }),
  };
  const queue = {
    enqueue: async (id: string, scheduledAt: Date, priority: number) =>
      calls.push(`enqueue:${id}:${scheduledAt.toISOString()}:${priority}`),
  };
  const locks = {
    acquireLock: async () => true,
    releaseLock: async (key: string) => calls.push(`release:${key}`),
  };
  const generated = await new RecurringSchedulerService(
    repository as never,
    queue as never,
    locks as never
  ).runOnce(now);
  assert.equal(generated, 1);
  assert.deepEqual(calls, [
    'claim:recurring-1:2026-08-14T10:00:00.000Z:2026-08-14T11:00:00.000Z',
    'enqueue:job-1:2026-08-14T10:00:00.000Z:25',
    'release:recurring:recurring-1',
  ]);
});

test('scheduler does not create or enqueue when another replica owns the definition lock', async () => {
  let created = false;
  let enqueued = false;
  const repository = { findDue: async () => [definition] };
  const queue = {
    enqueue: async () => {
      enqueued = true;
    },
  };
  const locks = { acquireLock: async () => false, releaseLock: async () => undefined };
  const generated = await new RecurringSchedulerService(
    repository as never,
    queue as never,
    locks as never
  ).runOnce(now);
  created = created || enqueued;
  assert.equal(generated, 0);
  assert.equal(created, false);
});

test('scheduler releases the lock and avoids duplicates when the atomic claim loses a race', async () => {
  let released = false;
  let created = false;
  const repository = {
    findDue: async () => [definition],
    claimNextExecution: async () => null,
    createExecution: async () => {
      created = true;
      return { id: 'unexpected', scheduledAt: now, priority: 25 };
    },
  };
  const queue = { enqueue: async () => undefined };
  const locks = {
    acquireLock: async () => true,
    releaseLock: async () => {
      released = true;
    },
  };
  const generated = await new RecurringSchedulerService(
    repository as never,
    queue as never,
    locks as never
  ).runOnce(now);
  assert.equal(generated, 0);
  assert.equal(created, false);
  assert.equal(released, true);
});
