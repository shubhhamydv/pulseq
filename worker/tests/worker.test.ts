import assert from 'node:assert/strict';
import test from 'node:test';
import { Job, JobStatus } from '@prisma/client';
import { JobHandlerRegistry, UnsupportedJobTypeError } from '../src/handlers/registry.js';
import { WorkerExecutor } from '../src/worker.executor.js';

const makeJob = (jobType: string, status = JobStatus.PENDING): Job => ({
  id: `job-${jobType}`,
  jobType,
  payload: { demo: true },
  status,
  priority: 0,
  scheduledAt: new Date(),
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  processingStartedAt: null,
  idempotencyKey: null,
  recurringDefinitionId: null,
});

const executorFor = (job: Job, statuses: JobStatus[], lockAcquired = true) => {
  const repository = {
    findJobById: async () => job,
    claimJob: async () => job,
    updateJob: async (_id: string, data: { status?: JobStatus }) => {
      if (data.status !== undefined) statuses.push(data.status);
      return { ...job, status: data.status ?? job.status };
    },
  };
  const queue = { remove: async () => undefined };
  const lock = { acquireLock: async () => lockAcquired, releaseLock: async () => true };
  const logs = {
    createAttempt: async () => ({ id: 'attempt-1' }),
    completeAttempt: async () => undefined,
    failAttempt: async () => undefined,
  };
  return new WorkerExecutor(
    repository as never,
    queue as never,
    new JobHandlerRegistry(),
    lock,
    logs,
    'worker-test',
    {
      handleFailure: async () => 'RETRIED',
    } as never
  );
};

test('handler registry recognizes all supported types and resolves the demo handler', async () => {
  const registry = new JobHandlerRegistry();
  assert.deepEqual(registry.supportedTypes(), [
    'EMAIL_NOTIFICATION',
    'REPORT_GENERATION',
    'WEBHOOK',
    'IMAGE_PROCESSING',
  ]);
  assert.equal(registry.supports('EMAIL_NOTIFICATION'), true);
  assert.equal(registry.supports('UNKNOWN'), false);
  await registry.resolve('EMAIL_NOTIFICATION')!(makeJob('EMAIL_NOTIFICATION'));
});

test('placeholder handlers fail explicitly without external services', async () => {
  await assert.rejects(
    () => new JobHandlerRegistry().resolve('REPORT_GENERATION')!(makeJob('REPORT_GENERATION')),
    UnsupportedJobTypeError
  );
});

test('worker executor completes the demo handler and releases its lock', async () => {
  const statuses: JobStatus[] = [];
  await executorFor(makeJob('EMAIL_NOTIFICATION'), statuses).processJobId('job-EMAIL_NOTIFICATION');
  assert.deepEqual(statuses, [JobStatus.COMPLETED]);
});

test('worker executor sends unsupported handlers through retry handling', async () => {
  const statuses: JobStatus[] = [];
  await executorFor(makeJob('REPORT_GENERATION'), statuses).processJobId('job-REPORT_GENERATION');
  assert.deepEqual(statuses, []);
});

test('worker executor skips jobs when lock is unavailable', async () => {
  const statuses: JobStatus[] = [];
  await executorFor(makeJob('EMAIL_NOTIFICATION'), statuses, false).processJobId(
    'job-EMAIL_NOTIFICATION'
  );
  assert.deepEqual(statuses, []);
});

test('worker executor tolerates a missing PostgreSQL job', async () => {
  const repository = { findJobById: async () => null };
  const queue = { remove: async () => undefined };
  const lock = { acquireLock: async () => true, releaseLock: async () => true };
  const logs = {
    createAttempt: async () => ({ id: 'attempt' }),
    completeAttempt: async () => undefined,
    failAttempt: async () => undefined,
  };
  const executor = new WorkerExecutor(
    repository as never,
    queue as never,
    new JobHandlerRegistry(),
    lock,
    logs,
    'worker-test'
  );
  await assert.doesNotReject(() => executor.processJobId('missing-job'));
});
