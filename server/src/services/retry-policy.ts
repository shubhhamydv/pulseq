export interface RetryConfig {
  baseDelayMs: number;
  jitterMs: number;
}

export const loadRetryConfig = (
  env: Record<string, string | undefined> = process.env
): RetryConfig => ({
  baseDelayMs: Number(env.RETRY_BASE_DELAY_MS ?? 1_000),
  jitterMs: Number(env.RETRY_JITTER_MS ?? 250),
});

export const calculateRetryDelay = (
  retryCount: number,
  config: RetryConfig,
  random: () => number = Math.random
): number => {
  const exponential = config.baseDelayMs * 2 ** retryCount;
  const jitter = Math.floor(Math.max(0, config.jitterMs) * random());
  return exponential + jitter;
};
