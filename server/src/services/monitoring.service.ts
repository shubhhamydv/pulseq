import { JobStatus } from '@prisma/client';
import { prisma } from '../repositories/jobs.repository.js';
import { redisService, RedisService } from '../infrastructure/redis/redis.service.js';
import {
  activeJobs,
  dlqSize,
  queueDepth,
  updateQueueMetrics,
  workerCount,
} from '../observability/metrics.js';

export interface WorkerMetric {
  workerId: string;
  hostname?: string;
  processId?: string;
  startedAt?: string;
  lastHeartbeat?: string;
  activeJobs: number;
  status: string;
  health: 'healthy' | 'stale' | 'unknown';
}

export class MonitoringService {
  public constructor(private readonly redis: RedisService = redisService) {}

  public async queueMetrics(): Promise<{
    queueDepth: number;
    activeJobs: number;
    dlqSize: number;
  }> {
    const [depth, running, dead, retrying] = await Promise.all([
      this.redis.getSortedSetSize('jobs:scheduled'),
      prisma.job.count({ where: { status: JobStatus.RUNNING } }),
      this.redis.getSetSize('jobs:dlq'),
      prisma.job.count({ where: { status: JobStatus.PENDING, retryCount: { gt: 0 } } }),
    ]);
    const pending = Math.max(depth - retrying, 0);
    queueDepth.set(depth);
    activeJobs.set(running);
    dlqSize.set(dead);
    updateQueueMetrics({ pending, processing: running, retry: retrying, deadLetter: dead });
    return { queueDepth: depth, activeJobs: running, dlqSize: dead };
  }

  public async workerMetrics(
    staleAfterMs = Number(process.env.WORKER_HEARTBEAT_TIMEOUT_MS ?? 20_000)
  ): Promise<{ workerCount: number; workers: WorkerMetric[] }> {
    const ids = await this.redis.getSetMembers('workers:registry');
    const now = Date.now();
    const workers = (
      await Promise.all(
        ids.map(async (workerId) => {
          const data = await this.redis.getHash(`workers:${workerId}`);
          if (!data.workerId) return null;
          const last = Date.parse(data.lastHeartbeat ?? '');
          return {
            workerId,
            hostname: data.hostname,
            processId: data.processId,
            startedAt: data.startedAt,
            lastHeartbeat: data.lastHeartbeat,
            activeJobs: Number(data.activeJobs ?? 0),
            status: data.status ?? 'unknown',
            health: Number.isFinite(last) && now - last <= staleAfterMs ? 'healthy' : 'stale',
          } as WorkerMetric;
        })
      )
    ).filter((worker): worker is WorkerMetric => worker !== null);
    workerCount.set(workers.length);
    return { workerCount: workers.length, workers };
  }

  public async jobMetrics(): Promise<{
    submitted: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
    retries: number;
    dlqSize: number;
    throughput: number;
    averageExecutionLatencyMs: number;
  }> {
    const [
      submitted,
      pending,
      running,
      completed,
      failed,
      cancelled,
      retries,
      retrying,
      dead,
      latency,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: JobStatus.PENDING } }),
      prisma.job.count({ where: { status: JobStatus.RUNNING } }),
      prisma.job.count({ where: { status: JobStatus.COMPLETED } }),
      prisma.job.count({ where: { status: JobStatus.FAILED } }),
      prisma.job.count({ where: { status: JobStatus.CANCELLED } }),
      prisma.job.aggregate({ _sum: { retryCount: true } }),
      prisma.job.count({ where: { status: JobStatus.PENDING, retryCount: { gt: 0 } } }),
      this.redis.getSetSize('jobs:dlq'),
      prisma.executionLog.aggregate({ _avg: { durationMs: true }, _count: { _all: true } }),
    ]);
    dlqSize.set(dead);
    updateQueueMetrics({
      pending,
      processing: running,
      retry: retrying,
      deadLetter: dead,
    });
    return {
      submitted,
      pending,
      running,
      completed,
      failed,
      cancelled,
      retries: retries._sum.retryCount ?? 0,
      dlqSize: dead,
      throughput: completed,
      averageExecutionLatencyMs: latency._avg.durationMs ?? 0,
    };
  }
}

export const monitoringService = new MonitoringService();
