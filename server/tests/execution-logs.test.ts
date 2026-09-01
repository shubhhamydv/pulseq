import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { ExecutionLogStatus } from '@prisma/client';
import { executionLogsRepository } from '../src/repositories/execution-logs.repository.js';
import { prisma } from '../src/repositories/jobs.repository.js';

test('execution logs preserve ordered attempts and outcomes', async () => {
  const job = await prisma.job.create({ data: { jobType: 'EMAIL_NOTIFICATION', payload: {} } });
  const firstStart = new Date('2026-08-14T12:00:00.000Z');
  const first = await executionLogsRepository.createAttempt({
    jobId: job.id,
    workerId: 'worker-a',
    startedAt: firstStart,
  });
  const second = await executionLogsRepository.createAttempt({
    jobId: job.id,
    workerId: 'worker-b',
    startedAt: new Date(firstStart.getTime() + 1000),
  });
  await executionLogsRepository.completeAttempt(first.id, new Date(firstStart.getTime() + 25), 25);
  await executionLogsRepository.failAttempt(
    second.id,
    new Date(firstStart.getTime() + 1100),
    100,
    'handler failed'
  );
  const logs = await executionLogsRepository.listByJobId(job.id);
  assert.deepEqual(
    logs.map((log) => log.id),
    [first.id, second.id]
  );
  assert.equal(logs[0].status, ExecutionLogStatus.SUCCESS);
  assert.equal(logs[0].durationMs, 25);
  assert.equal(logs[1].status, ExecutionLogStatus.FAILED);
  assert.equal(logs[1].error, 'handler failed');
  await prisma.executionLog.deleteMany({ where: { jobId: job.id } });
  await prisma.job.deleteMany({ where: { id: job.id } });
});

after(async () => {
  await prisma.$disconnect();
});
