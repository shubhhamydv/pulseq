import os from 'node:os';
import { RedisService } from '../../server/src/infrastructure/redis/redis.service.js';

export type WorkerStatus = 'starting' | 'idle' | 'busy' | 'stopping' | 'stale';

export interface WorkerInfo {
  workerId: string;
  hostname: string;
  processId: string;
  startedAt: string;
  lastHeartbeat: string;
  activeJobs: string;
  status: WorkerStatus;
}

export class WorkerHeartbeatService {
  public constructor(
    private readonly redis: RedisService,
    private readonly workerId: string,
    private readonly intervalMs = 5_000,
    private readonly staleAfterMs = 20_000,
    private readonly clock: () => Date = () => new Date()
  ) {}

  public key(): string {
    return `workers:${this.workerId}`;
  }
  public async register(): Promise<void> {
    const now = this.clock().toISOString();
    await this.redis.addToSet('workers:registry', this.workerId);
    await this.redis.setHash(this.key(), {
      workerId: this.workerId,
      hostname: os.hostname(),
      processId: String(process.pid),
      startedAt: now,
      lastHeartbeat: now,
      activeJobs: '0',
      status: 'idle',
    });
  }
  public async heartbeat(
    activeJobs: number,
    status: WorkerStatus = activeJobs > 0 ? 'busy' : 'idle'
  ): Promise<void> {
    await this.redis.setHash(this.key(), {
      lastHeartbeat: this.clock().toISOString(),
      activeJobs: String(activeJobs),
      status,
    });
  }
  public async setStatus(status: WorkerStatus, activeJobs = 0): Promise<void> {
    await this.redis.setHash(this.key(), {
      lastHeartbeat: this.clock().toISOString(),
      activeJobs: String(activeJobs),
      status,
    });
  }
  public async unregister(): Promise<void> {
    await this.redis.removeFromSet('workers:registry', this.workerId);
    await this.redis.clearKey(this.key());
  }
  public async getInfo(): Promise<WorkerInfo | null> {
    const data = await this.redis.getHash(this.key());
    return Object.keys(data).length === 0 ? null : (data as unknown as WorkerInfo);
  }
  public isStale(info: WorkerInfo, now = this.clock()): boolean {
    return now.getTime() - new Date(info.lastHeartbeat).getTime() > this.staleAfterMs;
  }
  public async listWorkers(): Promise<WorkerInfo[]> {
    const ids = await this.redis.getSetMembers('workers:registry');
    const workers = await Promise.all(ids.map(async (id) => this.redis.getHash(`workers:${id}`)));
    return workers
      .filter((worker) => Object.keys(worker).length > 0)
      .map((worker) => worker as unknown as WorkerInfo);
  }
  public heartbeatInterval(activeJobs: () => number = () => 0): NodeJS.Timeout {
    return setInterval(() => void this.heartbeat(activeJobs()), this.intervalMs);
  }
}
