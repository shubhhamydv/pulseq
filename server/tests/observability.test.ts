import assert from 'node:assert/strict';
import test from 'node:test';
import { MetricsRegistry } from '../src/observability/metrics.js';
import { WorkerHeartbeatService } from '../../worker/src/heartbeat.js';

test('metrics render Prometheus counters, gauges, and histograms', () => {
  const registry = new MetricsRegistry();
  registry.counter('test_submissions_total', 'Submitted jobs').add(2, { job_type: 'email' });
  registry.gauge('test_queue_depth', 'Queue depth').set(4);
  registry.histogram('test_latency_seconds', 'Latency').observe(0.2, { job_type: 'email' });
  const output = registry.render();
  assert.match(output, /# TYPE test_submissions_total counter/);
  assert.match(output, /test_submissions_total\{job_type="email"\} 2/);
  assert.match(output, /# TYPE test_queue_depth gauge/);
  assert.match(output, /# TYPE test_latency_seconds histogram/);
  assert.match(output, /test_latency_seconds_count\{job_type="email"\} 1/);
});

test('worker heartbeat registers, refreshes, tracks active jobs, and detects stale state', async () => {
  const hashes = new Map<string, Record<string, string>>();
  const members = new Set<string>();
  const redis = {
    addToSet: async (_key: string, member: string) => {
      members.add(member);
    },
    removeFromSet: async (_key: string, member: string) => {
      members.delete(member);
    },
    setHash: async (key: string, values: Record<string, string>) => {
      hashes.set(key, { ...(hashes.get(key) ?? {}), ...values });
    },
    getHash: async (key: string) => hashes.get(key) ?? {},
    getSetMembers: async () => [...members],
    clearKey: async (key: string) => {
      hashes.delete(key);
    },
  };
  let current = new Date('2026-08-14T00:00:00.000Z');
  const heartbeat = new WorkerHeartbeatService(
    redis as never,
    'worker-test',
    1000,
    5000,
    () => current
  );
  await heartbeat.register();
  assert.deepEqual([...members], ['worker-test']);
  await heartbeat.heartbeat(2);
  const info = await heartbeat.getInfo();
  assert.equal(info?.activeJobs, '2');
  assert.equal(info?.status, 'busy');
  assert.equal(heartbeat.isStale(info!, new Date('2026-08-14T00:00:04.000Z')), false);
  assert.equal(heartbeat.isStale(info!, new Date('2026-08-14T00:00:06.000Z')), true);
  current = new Date('2026-08-14T00:00:01.000Z');
  await heartbeat.setStatus('idle', 0);
  assert.equal((await heartbeat.getInfo())?.status, 'idle');
  await heartbeat.unregister();
  assert.equal(await heartbeat.getInfo(), null);
});
