import assert from 'node:assert/strict';
import { spawn, ChildProcess } from 'node:child_process';
import test, { after, before, beforeEach } from 'node:test';
import { JobStatus } from '@prisma/client';
import { jobsRepository, prisma } from '../src/repositories/jobs.repository.js';
import { redisService } from '../src/infrastructure/redis/redis.service.js';
import { SCHEDULED_JOBS_KEY } from '../src/infrastructure/redis/scheduler.queue.js';

const databaseUrl = process.env.DATABASE_URL;
const port = 3020;
const baseUrl = `http://127.0.0.1:${port}`;
const runApiTests = Boolean(databaseUrl);
let server: ChildProcess | undefined;

const waitForServer = async (): Promise<void> => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/v1/health`);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('API server did not start');
};

test('jobs HTTP API integration', { skip: !runApiTests }, async (suite) => {
  before(async () => {
    await prisma.$connect();
    server = spawn('node', ['--loader', 'ts-node/esm', 'src/index.ts'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), DATABASE_URL: databaseUrl },
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    await waitForServer();
  });

  beforeEach(async () => {
    await prisma.job.deleteMany();
    await redisService.clearKey(SCHEDULED_JOBS_KEY);
  });

  after(async () => {
    await prisma.job.deleteMany();
    await redisService.clearKey(SCHEDULED_JOBS_KEY);
    await redisService.disconnect();
    await prisma.$disconnect();
    server?.kill('SIGINT');
  });

  await suite.test('GET /metrics returns Prometheus exposition text', async () => {
    const response = await fetch(`${baseUrl}/metrics`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') ?? '', /text\/plain/);
    const body = await response.text();
    assert.match(body, /# HELP scheduler_jobs_processed_total/);
    assert.match(body, /# TYPE scheduler_http_requests_total counter/);
  });

  await suite.test('POST creates a pending job and GET retrieves it', async () => {
    const createResponse = await fetch(`${baseUrl}/api/v1/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobType: 'example-job', payload: {}, priority: 1, maxRetries: 3 }),
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as {
      id: string;
      status: JobStatus;
      scheduledAt: string;
    };
    assert.ok(created.id);
    assert.equal(created.status, JobStatus.PENDING);
    assert.equal(
      await redisService.getSortedSetScore(SCHEDULED_JOBS_KEY, created.id),
      Date.parse(created.scheduledAt)
    );
    assert.equal((await jobsRepository.findJobById(created.id))?.status, JobStatus.PENDING);

    const getResponse = await fetch(`${baseUrl}/api/v1/jobs/${created.id}`);
    assert.equal(getResponse.status, 200);
    const retrieved = (await getResponse.json()) as { id: string };
    assert.equal(retrieved.id, created.id);
  });

  await suite.test('POST rejects invalid input', async () => {
    const response = await fetch(`${baseUrl}/api/v1/jobs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobType: '', payload: [], priority: 101, maxRetries: -1 }),
    });
    assert.equal(response.status, 400);
  });

  await suite.test('GET list returns bounded pagination metadata', async () => {
    await jobsRepository.createJob({ jobType: 'one', payload: {} });
    await jobsRepository.createJob({ jobType: 'two', payload: {} });
    const response = await fetch(`${baseUrl}/api/v1/jobs?page=1&limit=1`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      data: unknown[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    };
    assert.equal(body.data.length, 1);
    assert.deepEqual(body.pagination, { page: 1, limit: 1, total: 2, totalPages: 2 });
  });

  await suite.test('GET list rejects invalid pagination', async () => {
    const response = await fetch(`${baseUrl}/api/v1/jobs?page=0&limit=101`);
    assert.equal(response.status, 400);
  });

  await suite.test('POST cancel cancels a pending job and preserves it', async () => {
    const created = await jobsRepository.createJob({ jobType: 'cancel-me', payload: {} });
    const response = await fetch(`${baseUrl}/api/v1/jobs/${created.id}/cancel`, { method: 'POST' });
    assert.equal(response.status, 200);
    const cancelled = (await response.json()) as { id: string; status: JobStatus };
    assert.equal(cancelled.id, created.id);
    assert.equal(cancelled.status, JobStatus.CANCELLED);

    const retrieved = await jobsRepository.findJobById(created.id);
    assert.equal(retrieved?.status, JobStatus.CANCELLED);
  });

  await suite.test('POST cancel rejects completed jobs and missing IDs', async () => {
    const completed = await jobsRepository.createJob({
      jobType: 'done',
      payload: {},
      status: JobStatus.COMPLETED,
    });
    const completedResponse = await fetch(`${baseUrl}/api/v1/jobs/${completed.id}/cancel`, {
      method: 'POST',
    });
    assert.equal(completedResponse.status, 409);

    const missingResponse = await fetch(`${baseUrl}/api/v1/jobs/missing-job/cancel`, {
      method: 'POST',
    });
    assert.equal(missingResponse.status, 404);

    const invalidResponse = await fetch(`${baseUrl}/api/v1/jobs//cancel`, { method: 'POST' });
    assert.equal(invalidResponse.status, 404);
  });
});
