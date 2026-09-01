import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prometheusRegistry,
  recordJobEnqueued,
  recordJobFailed,
  recordJobProcessed,
  updateQueueMetrics,
} from '../src/observability/metrics.js';

test('Prometheus registry exposes valid metric families', async () => {
  const before = await prometheusRegistry.getMetricsAsJSON();
  recordJobEnqueued('TEST_JOB');
  recordJobProcessed('TEST_JOB', 0.025);
  recordJobFailed('TEST_JOB', 0.01, 'retrying');
  updateQueueMetrics({ pending: 4, processing: 2, retry: 1, deadLetter: 3 });

  const output = await prometheusRegistry.metrics();
  assert.match(output, /# TYPE scheduler_jobs_enqueued_total counter/);
  assert.match(output, /# TYPE scheduler_jobs_processed_total counter/);
  assert.match(output, /# TYPE scheduler_jobs_failed_total counter/);
  assert.match(output, /# TYPE scheduler_job_execution_time_seconds histogram/);
  assert.match(output, /scheduler_jobs_enqueued_total\{[^}]*job_type="TEST_JOB"/);
  assert.match(output, /scheduler_job_execution_time_seconds_count\{[^}]*status="success"/);
  assert.match(output, /scheduler_queue_pending 4/);
  assert.match(output, /scheduler_queue_processing 2/);
  assert.match(output, /scheduler_queue_retry 1/);
  assert.match(output, /scheduler_queue_dead_letter 3/);

  const after = await prometheusRegistry.getMetricsAsJSON();
  assert.ok(after.length >= before.length);
  assert.ok(after.some((metric) => metric.name === 'scheduler_jobs_enqueued_total'));
});
