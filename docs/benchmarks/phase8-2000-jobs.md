# Phase 8 Benchmark Report: 2,000 Jobs

## Scope and integrity

This report contains one measured local run from the reproducible `scripts/load-test.mjs` harness. It is not a universal capacity claim. The run exercised the real HTTP submission path, PostgreSQL persistence, Redis scheduling, worker locking and claiming, handler execution, execution-log persistence, and result collection.

## Test environment

| Parameter              | Measured configuration                                        |
| ---------------------- | ------------------------------------------------------------- |
| Date                   | 2026-08-13 UTC                                                |
| API                    | Local Node.js production build on `localhost:3000`            |
| Database               | Local PostgreSQL, database `jobs_test`                        |
| Queue/locks            | Local Redis on `localhost:6379`                               |
| Workers                | 1 worker process                                              |
| Worker concurrency     | 20                                                            |
| Jobs                   | 2,000                                                         |
| Submission concurrency | 50 in-flight HTTP requests                                    |
| Job type               | `EMAIL_NOTIFICATION` demo handler                             |
| Payload                | Small JSON payload containing only benchmark marker and index |
| Retries                | `maxRetries=0`                                                |
| Priority               | `index % 10`                                                  |
| Poll interval          | 1,000 ms                                                      |

## Metric definitions

**Submission throughput** is accepted job creations divided by the measured submission phase duration. **Completion throughput** is successfully completed jobs divided by wall-clock time from benchmark start through completion. This definition includes submission and worker drain time and should not be confused with handler execution throughput. **Execution latency** is the persisted `durationMs` for an individual execution attempt, not queue waiting time. **Failure rate** is failed jobs divided by submitted jobs. **Duplicate execution rate** is the number of logical jobs with more than one recorded execution attempt divided by submitted jobs.

## Results

| Metric                                 |   Measured result |
| -------------------------------------- | ----------------: |
| Jobs submitted                         |             2,000 |
| Jobs completed                         |             2,000 |
| Failed jobs                            |                 0 |
| Failure rate                           |                0% |
| Jobs with duplicate execution attempts |                 0 |
| Duplicate execution rate               |                0% |
| Submission duration                    |     1.721 seconds |
| Submission throughput                  | 1,162.12 jobs/sec |
| End-to-end completion duration         |   154.557 seconds |
| Completion throughput                  |    12.94 jobs/sec |
| Execution latency p50                  |              6 ms |
| Execution latency p95                  |              8 ms |
| Execution latency p99                  |             10 ms |
| Execution-duration samples             |             2,000 |

## Interpretation

The run completed all submitted jobs without failures or duplicate execution attempts. The large difference between submission throughput and completion throughput reflects the measured definition: completion throughput includes the full drain interval and was limited by the worker’s polling behavior and the local benchmark configuration. The execution-duration percentiles show handler and completion-path duration only; they do not include time spent waiting in the scheduled Redis queue.

This run does not demonstrate sustained production capacity, multi-worker scaling, Redis or PostgreSQL saturation limits, crash recovery under load, or behavior with retry-heavy workloads. A second run with multiple workers and different concurrency should be added before making comparative scaling claims. No unsupported throughput target is claimed.

## Reproduction

Start the local dependencies and application, then run:

```bash
JOBS=2000 \
SUBMISSION_CONCURRENCY=50 \
API_URL=http://localhost:3000 \
node scripts/load-test.mjs | tee docs/benchmarks/phase8-2000-jobs.json
```
