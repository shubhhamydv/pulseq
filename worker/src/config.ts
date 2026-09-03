const positiveInteger = (name: string, rawValue: string | undefined, fallback: number): number => {
  if (rawValue === undefined || rawValue.trim() === '') return fallback;
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return value;
};

export interface WorkerConfig {
  concurrency: number;
  lockTtlMs: number;
  pollIntervalMs: number;
  batchLimit: number;
  processingLeaseMs: number;
  heartbeatIntervalMs: number;
  heartbeatTimeoutMs: number;
}

export const loadWorkerConfig = (env: NodeJS.ProcessEnv = process.env): WorkerConfig => ({
  concurrency: positiveInteger('WORKER_CONCURRENCY', env.WORKER_CONCURRENCY, 10),
  lockTtlMs: positiveInteger('WORKER_LOCK_TTL_MS', env.WORKER_LOCK_TTL_MS, 30_000),
  pollIntervalMs: positiveInteger('WORKER_POLL_INTERVAL_MS', env.WORKER_POLL_INTERVAL_MS, 1_000),
  batchLimit: positiveInteger('WORKER_BATCH_LIMIT', env.WORKER_BATCH_LIMIT, 10),
  processingLeaseMs: positiveInteger(
    'WORKER_PROCESSING_LEASE_MS',
    env.WORKER_PROCESSING_LEASE_MS,
    60_000
  ),
  heartbeatIntervalMs: positiveInteger(
    'WORKER_HEARTBEAT_INTERVAL_MS',
    env.WORKER_HEARTBEAT_INTERVAL_MS,
    5_000
  ),
  heartbeatTimeoutMs: positiveInteger(
    'WORKER_HEARTBEAT_TIMEOUT_MS',
    env.WORKER_HEARTBEAT_TIMEOUT_MS,
    20_000
  ),
});
