import assert from 'node:assert/strict';
import test from 'node:test';
import { JobStatus } from '@prisma/client';
import {
  InvalidStateTransitionError,
  JobNotFoundError,
  JobsService,
} from '../src/services/jobs.service.js';

const job = (status: JobStatus) => ({
  id: 'job-1',
  jobType: 'test',
  payload: {},
  status,
  priority: 0,
  scheduledAt: new Date(),
  retryCount: 0,
  maxRetries: 3,
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

test('service transition rules reject terminal jobs moving to running', async () => {
  for (const status of [JobStatus.COMPLETED, JobStatus.FAILED]) {
    const repository = {
      findJobById: async () => job(status),
      updateJob: async () => job(JobStatus.RUNNING),
    };
    const service = new JobsService(repository as never);
    await assert.rejects(
      () => service.transitionJob('job-1', JobStatus.RUNNING),
      (error: unknown) => error instanceof InvalidStateTransitionError
    );
  }
});

test('service cancellation rejects completed and failed jobs', async () => {
  for (const status of [JobStatus.COMPLETED, JobStatus.FAILED]) {
    const repository = { findJobById: async () => job(status) };
    const service = new JobsService(repository as never);
    await assert.rejects(
      () => service.cancelJob('job-1'),
      (error: unknown) => error instanceof InvalidStateTransitionError
    );
  }
});

test('service cancellation reports a missing job', async () => {
  const repository = { findJobById: async () => null };
  const service = new JobsService(repository as never);
  await assert.rejects(
    () => service.cancelJob('missing'),
    (error: unknown) => error instanceof JobNotFoundError
  );
});
