#!/usr/bin/env node

const apiUrl = process.env.API_URL ?? 'http://localhost:3000';
const totalJobs = Number(process.env.JOBS ?? 2000);
const submissionConcurrency = Number(process.env.SUBMISSION_CONCURRENCY ?? 50);
const pollMs = Number(process.env.POLL_MS ?? 1000);
const timeoutMs = Number(process.env.TIMEOUT_MS ?? 300_000);

const request = async (path, options = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${path}`);
  return response.json();
};
const percentile = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1)];
};
const runPool = async (items, concurrency, fn) => {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await fn(items[index], index);
    }
  });
  await Promise.all(workers);
};

const startedAt = Date.now();
const baseline = await request('/api/v1/metrics/jobs');
const ids = [];
const submissionStarted = Date.now();
await runPool(
  Array.from({ length: totalJobs }, (_, index) => index),
  submissionConcurrency,
  async (index) => {
    const job = await request('/api/v1/jobs', {
      method: 'POST',
      headers: { 'Idempotency-Key': `benchmark-${process.pid}-${startedAt}-${index}` },
      body: JSON.stringify({
        jobType: 'EMAIL_NOTIFICATION',
        payload: { benchmark: true, index },
        maxRetries: 0,
        priority: index % 10,
      }),
    });
    ids.push(job.id);
  }
);
const submissionDurationMs = Date.now() - submissionStarted;
const targetCompleted = baseline.completed + totalJobs;
const deadline = Date.now() + timeoutMs;
let metrics = baseline;
while (Date.now() < deadline) {
  metrics = await request('/api/v1/metrics/jobs');
  if (metrics.completed >= targetCompleted) break;
  await new Promise((resolve) => setTimeout(resolve, pollMs));
}
const completionDurationMs = Date.now() - startedAt;
const resultRows = [];
await runPool(ids, submissionConcurrency, async (id) => {
  try {
    const [job, history] = await Promise.all([
      request(`/api/v1/jobs/${id}`),
      request(`/api/v1/jobs/${id}/executions`),
    ]);
    resultRows.push({ job, attempts: history.data ?? [] });
  } catch (error) {
    resultRows.push({ job: { id, status: 'UNKNOWN' }, attempts: [], error: String(error) });
  }
});
const durations = resultRows.flatMap((row) =>
  row.attempts.map((attempt) => Number(attempt.durationMs)).filter(Number.isFinite)
);
const failures = resultRows.filter((row) => row.job.status === 'FAILED').length;
const duplicates = resultRows.filter((row) => row.attempts.length > 1).length;
const completed = resultRows.filter((row) => row.job.status === 'COMPLETED').length;
const report = {
  environment: { apiUrl, jobs: totalJobs, submissionConcurrency, pollMs, timeoutMs },
  measuredAt: new Date().toISOString(),
  baseline,
  results: {
    submitted: ids.length,
    completed,
    failed: failures,
    timedOut: completed < totalJobs,
    duplicateJobs: duplicates,
    duplicateExecutionRate: ids.length ? duplicates / ids.length : 0,
    failureRate: ids.length ? failures / ids.length : 0,
    submissionThroughputPerSecond: ids.length / (submissionDurationMs / 1000),
    completionThroughputPerSecond: completed / (completionDurationMs / 1000),
    executionDurationMs: {
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      p99: percentile(durations, 0.99),
      samples: durations.length,
    },
    submissionDurationMs,
    completionDurationMs,
  },
};
console.log(JSON.stringify(report, null, 2));
if (report.results.timedOut) process.exitCode = 2;
