import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const prometheusRegistry = new Registry();
collectDefaultMetrics({ register: prometheusRegistry, prefix: 'scheduler_' });

const metricLabels = ['queue', 'job_type', 'status'] as const;
export const schedulerJobsProcessedTotal = new Counter({
  name: 'scheduler_jobs_processed_total',
  help: 'Number of successfully processed jobs',
  labelNames: metricLabels,
  registers: [prometheusRegistry],
});
export const schedulerJobsFailedTotal = new Counter({
  name: 'scheduler_jobs_failed_total',
  help: 'Number of failed job executions',
  labelNames: metricLabels,
  registers: [prometheusRegistry],
});
export const schedulerJobsEnqueuedTotal = new Counter({
  name: 'scheduler_jobs_enqueued_total',
  help: 'Number of jobs added to the scheduler queue',
  labelNames: metricLabels,
  registers: [prometheusRegistry],
});
export const schedulerJobExecutionTimeSeconds = new Histogram({
  name: 'scheduler_job_execution_time_seconds',
  help: 'Job execution duration in seconds',
  labelNames: metricLabels,
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60],
  registers: [prometheusRegistry],
});
export const schedulerQueuePending = new Gauge({
  name: 'scheduler_queue_pending',
  help: 'Number of jobs pending in the scheduled Redis queue',
  registers: [prometheusRegistry],
});
export const schedulerQueueProcessing = new Gauge({
  name: 'scheduler_queue_processing',
  help: 'Number of jobs currently processing',
  registers: [prometheusRegistry],
});
export const schedulerQueueRetry = new Gauge({
  name: 'scheduler_queue_retry',
  help: 'Number of jobs waiting for retry',
  registers: [prometheusRegistry],
});
export const schedulerQueueDeadLetter = new Gauge({
  name: 'scheduler_queue_dead_letter',
  help: 'Number of jobs in the dead-letter queue',
  registers: [prometheusRegistry],
});
export const schedulerHttpRequestsTotal = new Counter({
  name: 'scheduler_http_requests_total',
  help: 'Total number of HTTP requests handled by the API',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [prometheusRegistry],
});
export const schedulerHttpRequestDurationSeconds = new Histogram({
  name: 'scheduler_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [prometheusRegistry],
});

export type MetricKind = 'counter' | 'gauge' | 'histogram';

type Labels = Record<string, string>;

const escapeLabel = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
const labelKey = (labels: Labels): string =>
  Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('|');
const labelsText = (labels: Labels): string => {
  const entries = Object.entries(labels);
  return entries.length === 0
    ? ''
    : `{${entries.map(([key, value]) => `${key}="${escapeLabel(value)}"`).join(',')}}`;
};

export interface MetricSnapshot {
  name: string;
  type: MetricKind;
  help: string;
  labels: Labels;
  value: number;
  buckets?: Record<string, number>;
  sum?: number;
  count?: number;
}

class Metric {
  private readonly values = new Map<
    string,
    { labels: Labels; value: number; buckets: Map<number, number>; sum: number; count: number }
  >();
  public constructor(
    public readonly name: string,
    public readonly type: MetricKind,
    public readonly help: string,
    private readonly histogramBuckets: number[] = []
  ) {}
  public add(value: number, labels: Labels = {}): void {
    const entry = this.values.get(labelKey(labels)) ?? {
      labels: { ...labels },
      value: 0,
      buckets: new Map(),
      sum: 0,
      count: 0,
    };
    entry.value += value;
    this.values.set(labelKey(labels), entry);
  }
  public set(value: number, labels: Labels = {}): void {
    const entry = this.values.get(labelKey(labels)) ?? {
      labels: { ...labels },
      value: 0,
      buckets: new Map(),
      sum: 0,
      count: 0,
    };
    entry.value = value;
    this.values.set(labelKey(labels), entry);
  }
  public observe(value: number, labels: Labels = {}): void {
    const entry = this.values.get(labelKey(labels)) ?? {
      labels: { ...labels },
      value: 0,
      buckets: new Map(),
      sum: 0,
      count: 0,
    };
    entry.sum += value;
    entry.count += 1;
    for (const bucket of this.histogramBuckets)
      if (value <= bucket) entry.buckets.set(bucket, (entry.buckets.get(bucket) ?? 0) + 1);
    this.values.set(labelKey(labels), entry);
  }
  public snapshots(): MetricSnapshot[] {
    return [...this.values.values()].map((entry) => ({
      name: this.name,
      type: this.type,
      help: this.help,
      labels: entry.labels,
      value: entry.value,
      buckets: Object.fromEntries(
        [...entry.buckets].map(([bucket, count]) => [String(bucket), count])
      ),
      sum: entry.sum,
      count: entry.count,
    }));
  }
}

export class MetricsRegistry {
  private readonly metrics = new Map<string, Metric>();
  public counter(name: string, help: string): Metric {
    return this.register(name, 'counter', help);
  }
  public gauge(name: string, help: string): Metric {
    return this.register(name, 'gauge', help);
  }
  public histogram(name: string, help: string, buckets = [0.01, 0.05, 0.1, 0.5, 1, 5, 10]): Metric {
    return this.register(name, 'histogram', help, buckets);
  }
  private register(name: string, type: MetricKind, help: string, buckets?: number[]): Metric {
    const existing = this.metrics.get(name);
    if (existing) return existing;
    const metric = new Metric(name, type, help, buckets);
    this.metrics.set(name, metric);
    return metric;
  }
  public snapshots(): MetricSnapshot[] {
    return [...this.metrics.values()].flatMap((metric) => metric.snapshots());
  }
  public render(): string {
    const lines: string[] = [];
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`, `# TYPE ${metric.name} ${metric.type}`);
      for (const sample of metric.snapshots()) {
        if (metric.type === 'histogram') {
          for (const [bucket, count] of Object.entries(sample.buckets ?? {}))
            lines.push(
              `${metric.name}_bucket${labelsText({ ...sample.labels, le: bucket })} ${count}`
            );
          lines.push(
            `${metric.name}_bucket${labelsText({ ...sample.labels, le: '+Inf' })} ${sample.count ?? 0}`,
            `${metric.name}_sum${labelsText(sample.labels)} ${sample.sum ?? 0}`,
            `${metric.name}_count${labelsText(sample.labels)} ${sample.count ?? 0}`
          );
        } else lines.push(`${metric.name}${labelsText(sample.labels)} ${sample.value}`);
      }
    }
    return `${lines.join('\n')}\n`;
  }
}

export const metrics = new MetricsRegistry();
export const jobsSubmitted = metrics.counter('jobs_submitted_total', 'Total jobs submitted');
export const jobsCompleted = metrics.counter('jobs_completed_total', 'Total jobs completed');
export const jobsFailed = metrics.counter('jobs_failed_total', 'Total jobs failed');
export const jobsRetried = metrics.counter('jobs_retried_total', 'Total job retries');
export const lockAcquisitionFailures = metrics.counter(
  'job_lock_acquisition_failures_total',
  'Total failed job lock acquisitions'
);
export const queueDepth = metrics.gauge('scheduler_queue_depth', 'Current scheduled queue depth');
export const activeJobs = metrics.gauge('scheduler_active_jobs', 'Current active jobs');
export const workerCount = metrics.gauge(
  'scheduler_worker_count',
  'Current registered worker count'
);
export const dlqSize = metrics.gauge('scheduler_dlq_size', 'Current dead letter queue size');
export const executionLatency = metrics.histogram(
  'job_execution_latency_seconds',
  'Job execution latency in seconds'
);

export const recordJobEnqueued = (jobType: string): void => {
  schedulerJobsEnqueuedTotal.inc({ queue: 'scheduled', job_type: jobType, status: 'enqueued' });
};

export const recordJobProcessed = (jobType: string, durationSeconds: number): void => {
  schedulerJobsProcessedTotal.inc({ queue: 'scheduled', job_type: jobType, status: 'success' });
  schedulerJobExecutionTimeSeconds.observe(
    { queue: 'scheduled', job_type: jobType, status: 'success' },
    durationSeconds
  );
};

export const recordJobFailed = (
  jobType: string,
  durationSeconds: number,
  status: 'failed' | 'retrying'
): void => {
  schedulerJobsFailedTotal.inc({ queue: 'scheduled', job_type: jobType, status });
  schedulerJobExecutionTimeSeconds.observe(
    { queue: 'scheduled', job_type: jobType, status },
    durationSeconds
  );
};

export const updateQueueMetrics = (values: {
  pending: number;
  processing: number;
  retry: number;
  deadLetter: number;
}): void => {
  schedulerQueuePending.set(values.pending);
  schedulerQueueProcessing.set(values.processing);
  schedulerQueueRetry.set(values.retry);
  schedulerQueueDeadLetter.set(values.deadLetter);
};
