# Distributed Job Scheduler & Async Event Engine

## Cover
Distributed Job Scheduler & Async Event Engine
Architecture, Reliability, and Measured Performance

## Slide 1
### A control plane for reliable asynchronous work
- Accepts scheduled, recurring, prioritized, and idempotent jobs through a REST API.
- Separates durable job state from Redis scheduling and worker execution.
- Gives operators live visibility into queues, workers, retries, DLQ state, and execution history.

## Slide 2
### The system separates coordination from execution
- Express API: submission, cancellation, replay, history, monitoring, and Prometheus-compatible metrics.
- PostgreSQL / Prisma: durable job definitions, state transitions, recurring definitions, idempotency, and execution logs.
- Redis: due-time sorted sets, priority metadata, distributed locks, DLQ membership, and worker heartbeats.
- Independent scheduler and horizontally scalable worker pool complete the control plane.

## Slide 3
### Every job follows a durable, observable lifecycle
- Submission → PostgreSQL persistence → recurring scheduling or due-time enqueue.
- Worker claim → Redis lock → PostgreSQL processing transition → handler execution.
- Success → completion log; failure → exponential backoff and jitter, then retry or DLQ.
- Each attempt is recorded so operators can distinguish queue waiting, execution, retry, and final failure.

## Slide 4
### Distributed coordination is built around race-safe claims
- Workers poll due job IDs from Redis and compete safely for PostgreSQL state transitions.
- Redis locks use job-scoped keys with TTLs to limit duplicate active execution.
- Processing leases and heartbeats support recovery after worker crashes.
- Priority is preserved among due jobs; higher priority is selected first rather than globally reordering future work.

## Slide 5
### Reliability is honest: effectively-once, not exactly-once
- Idempotency keys make repeated API submissions return the original logical job.
- Retries use bounded exponential backoff with jitter and end in a replayable DLQ.
- Execution logs expose attempts, errors, duration, worker identity, and final state.
- Exactly-once side effects remain the handler’s responsibility; durable idempotency is the business safety boundary.

## Slide 6
### Operators get a live view of system health
- React operations dashboard: jobs, failed jobs, DLQ, workers, metrics, and job detail.
- Prometheus-compatible counters, gauges, and execution-latency histograms expose scrapeable signals.
- Worker heartbeats classify healthy, degraded, and offline processes.
- Structured Pino logs carry request IDs, job IDs, worker IDs, attempt numbers, status, and duration without payload leakage.

## Slide 7
### The dashboard follows the operator’s investigation path
- Overview: queue depth, active jobs, completion rate, DLQ size, and recovery counts.
- Jobs: search, status filters, pagination, priority, retry posture, and scheduling timestamps.
- Job detail: payload inspection, readable error information, and execution-history timeline.
- Workers and metrics: heartbeat freshness, active capacity, throughput, latency, and failure signals.

## Slide 8
### Deployment is reproducible and horizontally extensible
- Docker Compose includes PostgreSQL, Redis, API, scheduler, worker, and frontend.
- Multi-stage Dockerfiles produce production-oriented images; runtime services use non-root users where supported.
- Worker replicas can scale independently, for example: `docker compose up --build --scale worker=3`.
- Health checks and dependency conditions let services wait for PostgreSQL and Redis readiness.

## Slide 9
### A measured run completed 2,000 jobs without duplicates
- Test: 2,000 `EMAIL_NOTIFICATION` jobs, one worker, concurrency 20, 50 concurrent submissions, no retries.
- 2,000 completed; 0 failed; 0 duplicate execution attempts.
- Submission throughput: **1,162.12 jobs/sec**.
- End-to-end completion throughput: **12.94 jobs/sec**; execution duration p50/p95/p99: **6 / 8 / 10 ms**.
- Completion throughput includes the full drain interval and is not a universal capacity claim.

## Slide 10
### What the benchmark demonstrates—and what it does not
- Demonstrates an end-to-end path through HTTP, PostgreSQL, Redis, locking, worker execution, and execution logs.
- Demonstrates zero observed failures and duplicate attempts in this documented local run.
- Does not establish multi-worker scaling limits, saturation ceilings, crash recovery under load, or retry-heavy behavior.
- Next credible benchmark: compare one versus multiple workers across several concurrency levels with the same measured definitions.

## Closing
A production-oriented distributed scheduler with explicit consistency boundaries

Durable state. Coordinated execution. Observable failure handling. Honest performance claims.
