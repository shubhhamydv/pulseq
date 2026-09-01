import assert from 'node:assert/strict';
import test, { after, before, beforeEach } from 'node:test';
import { JobStatus } from '@prisma/client';
import { jobsRepository, prisma } from '../src/repositories/jobs.repository.js';

const databaseConfigured = Boolean(process.env.DATABASE_URL);

test('jobs repository integration', { skip: !databaseConfigured }, async (suite) => {
  before(async () => {
    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.job.deleteMany();
  });

  after(async () => {
    await prisma.job.deleteMany();
    await prisma.$disconnect();
  });

  await suite.test('createJob persists supplied and generated fields', async () => {
    const job = await jobsRepository.createJob({
      jobType: 'email.send',
      payload: { recipient: 'user@example.com' },
      priority: 10,
    });

    assert.ok(job.id);
    assert.ok(job.createdAt instanceof Date);
    assert.ok(job.updatedAt instanceof Date);
    assert.equal(job.jobType, 'email.send');
    assert.deepEqual(job.payload, { recipient: 'user@example.com' });
    assert.equal(job.status, JobStatus.PENDING);
  });

  await suite.test('findJobById returns a job or null', async () => {
    const created = await jobsRepository.createJob({ jobType: 'report.generate', payload: {} });
    assert.equal((await jobsRepository.findJobById(created.id))?.id, created.id);
    assert.equal(await jobsRepository.findJobById('missing-job-id'), null);
  });

  await suite.test('listJobs supports status, priority, and scheduled-time filters', async () => {
    await jobsRepository.createJob({ jobType: 'low', payload: {}, priority: 1 });
    const scheduled = new Date(Date.now() + 60_000);
    await jobsRepository.createJob({
      jobType: 'high',
      payload: {},
      priority: 20,
      status: JobStatus.FAILED,
      scheduledAt: scheduled,
    });

    const jobs = await jobsRepository.listJobs({
      status: JobStatus.FAILED,
      priority: 20,
      scheduledAfter: new Date(Date.now() - 1_000),
    });
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0]?.jobType, 'high');
  });

  await suite.test('updateJob changes mutable fields only', async () => {
    const created = await jobsRepository.createJob({ jobType: 'old', payload: { value: 1 } });
    const updated = await jobsRepository.updateJob(created.id, {
      jobType: 'new',
      payload: { value: 2 },
      retryCount: 1,
    });
    assert.equal(updated.id, created.id);
    assert.equal(updated.jobType, 'new');
    assert.deepEqual(updated.payload, { value: 2 });
    assert.equal(updated.retryCount, 1);
    assert.equal(updated.createdAt.getTime(), created.createdAt.getTime());
  });

  await suite.test('cancelJob preserves the record and marks it cancelled', async () => {
    const created = await jobsRepository.createJob({ jobType: 'cancel.me', payload: {} });
    const cancelled = await jobsRepository.cancelJob(created.id);
    assert.ok(cancelled);
    assert.equal(cancelled.status, JobStatus.CANCELLED);
    assert.equal((await jobsRepository.findJobById(created.id))?.id, created.id);
  });
});
