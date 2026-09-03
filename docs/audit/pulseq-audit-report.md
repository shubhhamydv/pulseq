# PulseQ — Production Benchmark, Dependency, and Distributed-Systems Audit

**Audit scope.** This audit reviewed the repository, package manifests, lockfile, TypeScript configuration, Prisma schema and migrations, Redis abstractions, API, worker, scheduler, frontend, Docker assets, documentation, tests, and live local behavior. Findings below are classified only from observed source, commands, tests, or runtime probes. The audit did not rewrite working components.

## Executive assessment

PulseQ is a credible portfolio implementation of a distributed job scheduler with a clear separation between durable state, fast coordination, and bounded execution. The strongest verified areas are the PostgreSQL state model, Redis job coordination, worker locking, idempotent API submission, recurring scheduling tests, observability surface, and the measured end-to-end benchmark. The system should be described as **effectively-once at the business boundary when handlers are idempotent, with at-least-once execution attempts**; it is not exactly-once.

The most important audit finding is reproducibility: a clean `npm ci` succeeds, but a clean checkout cannot pass typecheck/build until `npx prisma generate --schema server/prisma/schema.prisma` is run. The Dockerfiles do run Prisma generation, but the documented clean-install developer path should make this step explicit or automate it through a lifecycle script. Docker runtime validation could not be performed in this sandbox because the Docker CLI is unavailable. The code and tests are otherwise in good shape, but the repository-wide formatting gate currently includes generated presentation HTML and slide state artifacts that are not formatted by the project’s ordinary source workflow.

## 1. Actual technology inventory

| Area | Verified implementation | Evidence |
|---|---|---|
| Runtime | Node.js v22.13.0; npm 10.9.2 | Runtime command output |
| Language | TypeScript, strict mode, ES modules | Root and workspace `tsconfig.json` |
| API | Express 4.21.x family, REST routes | `server/src/index.ts`, `server/src/routes` |
| Persistence | PostgreSQL with Prisma 6.19.3 generated client | `server/prisma/schema.prisma`, migrations, `npx prisma --version` |
| Queue/coordination | Redis 7-compatible server with ioredis 5.x | Redis service and queue abstractions |
| Logging | Pino 9.x | API, worker, scheduler source |
| Frontend | React 18, Vite 5, Wouter, Recharts 3, lucide-react | `client/package.json` |
| Testing | Node test runner with ts-node loader; no Vitest/Jest/Supertest detected | `server/tests`, `worker/tests`, package scripts |
| Deployment | Four multi-stage Dockerfiles and Docker Compose | Root Dockerfiles and `infra/docker-compose.yml` |
| CI | No GitHub Actions workflow detected in the repository inventory | `.github` inventory |

### Workspace topology

The monorepo contains four npm workspaces: `server`, `worker`, `scheduler`, and `client`. The worker and scheduler TypeScript configurations compile selected shared server source into their own `dist` trees, which is functional but increases build-context and artifact complexity. The root lockfile is now versioned and uses npm 10-compatible lockfile metadata.

## 2. Required dependencies to run PulseQ

| Requirement | Required value or configuration | Notes |
|---|---|---|
| Node.js | >=18 declared; v22.13.0 verified | Node 22 passed the source checks in this environment. |
| npm | >=9 declared; v10.9.2 verified | `npm ci` succeeded in a clean temporary copy. |
| PostgreSQL | PostgreSQL-compatible server; local audit used PostgreSQL 16 service | Docker Compose uses `postgres:16-alpine`. |
| Redis | Redis-compatible server; local audit used Redis 7 service | Docker Compose uses `redis:7-alpine`. |
| Prisma client | `npx prisma generate --schema server/prisma/schema.prisma` | Required after clean install unless generated automatically. |
| API | `DATABASE_URL`, `REDIS_URL`, optional `PORT`, `NODE_ENV` | API defaults are documented in `server/.env.example`. |
| Worker | Database/Redis URLs plus concurrency, polling, lock, lease, and heartbeat settings | `worker/src/config.ts` validates positive integer values. |
| Scheduler | Database/Redis URLs plus scheduler poll and lock settings | Scheduler currently parses numeric environment values directly. |
| Frontend | `VITE_API_URL` optional; defaults to `http://localhost:3000` | Docker local access is therefore host-oriented rather than same-origin proxying. |

### Dependency observations

The runtime dependency set is appropriately small for the project. Prisma and ioredis are used directly in the service layer; Pino is used for structured logging; Recharts and lucide-react are used by the operations dashboard. `cron-parser` is used for recurring schedules. The package manifests declare compatible ranges such as Prisma `^6.14.0` and TypeScript `^5.5.4`, while the lockfile resolves Prisma 6.19.3 and TypeScript 5.9.3. This is acceptable for a portfolio project, but future upgrades should be deliberate because Prisma, TypeScript, Vite, and Recharts are all version-sensitive build dependencies.

The audit found no separate concurrency or distributed-lock package; those mechanisms are implemented in project code using Redis primitives and PostgreSQL conditional updates. This reduces dependency surface but places more correctness responsibility on the project’s tests and operational review.

## 3. Clean-install and quality-gate results

| Check | Result | Evidence and interpretation |
|---|---|---|
| `npm ci` in clean temporary copy | PASS | Lockfile is sufficient for dependency installation. |
| Typecheck immediately after `npm ci` | FAIL | Prisma client types are absent until generation runs. |
| `npx prisma generate` then typecheck | PASS | All four workspaces typechecked. |
| Build after Prisma generation | PASS | Server, worker, client, and scheduler built successfully. |
| ESLint | PASS | Zero lint errors and zero warnings under the configured max-warnings policy; TypeScript parser version warning is emitted by the toolchain. |
| Server tests | PASS | 38 tests passed in the verified local run. |
| Worker tests | PASS | 9 tests passed in the verified local run. |
| Source formatting before presentation artifacts | PASS | Earlier Phase 8 quality gate passed. |
| Repository-wide formatting after presentation artifacts | FAIL | `docs/phase8-deck/*.html`, `slide_state.json`, and `docs/phase8-presentation.md` are not Prettier-formatted under the root glob. |
| Docker Compose execution | NOT EXECUTED | Docker CLI is unavailable in the audit sandbox. |

### Finding F-01 — clean-install setup is incomplete without Prisma generation

**Severity: Medium.** A new developer running the expected sequence `npm ci && npm run build` fails because `@prisma/client` has no generated model exports. The failure is deterministic and was reproduced in a temporary clean copy. Running `npx prisma generate --schema server/prisma/schema.prisma` resolves the issue. The Dockerfiles already include generation, so this is primarily a local developer onboarding and CI reproducibility defect.

**Recommendation.** Add a root `postinstall` script that runs the schema-specific Prisma generation, or add a documented `npm run prisma:generate` step before typecheck/build and ensure all CI workflows call it. A lifecycle script should be evaluated against deployment environments before adoption.

### Finding F-02 — repository-wide formatting scope includes presentation artifacts

**Severity: Low.** The root `format:check` scans generated slide HTML and internal slide state alongside source code. Those artifacts currently fail Prettier even though production source lint/build/test checks pass.

**Recommendation.** Either format the presentation artifacts with a dedicated presentation formatter or exclude `docs/phase8-deck` and generated state from the engineering `format:check` glob. Keep a separate documentation/deck validation command if desired.

## 4. API functional smoke matrix

| Endpoint | Valid probe | Invalid/nonexistent probe | Observed result | Status |
|---|---|---|---|---|
| `GET /api/v1/health` | Live dependency check | Redis/PostgreSQL outage probes | 200 when healthy; 503 with PostgreSQL unhealthy during controlled stop; returned 200 again after restart | PASS |
| `GET /api/v1/status` | Live status and memory | Not applicable | 200 with uptime, environment, memory, version | PASS |
| `GET /api/v1/metrics/jobs` | Live aggregate metrics | Not applicable | 200 with submitted, pending, running, completed, failed, cancelled, retries, DLQ, throughput, latency | PASS |
| `GET /api/v1/metrics/queue` | Live queue metrics | Not applicable | 200 with queue depth, active jobs, DLQ size | PASS |
| `GET /api/v1/metrics/workers` | Live heartbeat registry | Not applicable | 200 with worker ID, host, process, heartbeat, active jobs, status, health | PASS |
| `GET /api/v1/jobs` | Pagination `page=1&limit=3` | Malformed pagination should be tested further | 200 with data and pagination envelope | PASS |
| `POST /api/v1/jobs` | Valid `EMAIL_NOTIFICATION` job | `{}` | Valid request 201; missing job type 400 validation error | PASS |
| `GET /api/v1/jobs/:id` | Existing job | Nonexistent ID | 200 existing; 404 `Job not found` | PASS |
| `POST /api/v1/jobs/:id/cancel` | Pending job | Invalid transition should be tested across terminal states | 200 for pending audit job; state became `CANCELLED` | PASS |
| `GET /api/v1/jobs/:id/executions` | Existing job | Nonexistent ID | 200 execution envelope for existing job; route returns 404 when job absent | PASS |
| `GET /api/v1/jobs/dlq` | Empty/live DLQ | Not applicable | 200 with `{data: []}` in tested state | PASS |
| `POST /api/v1/jobs/:id/retry` | Failed job replay | Invalid state and duplicate replay need broader matrix | 200 replayed failed job to `PENDING` | PASS |
| `GET /metrics` | Not re-probed in this audit | Not applicable | Implemented in source; should be included in CI smoke tests | OPEN |

### Idempotency evidence

A sequential duplicate submission with the same `Idempotency-Key` returned HTTP 201 twice with the same job ID and identical persisted timestamps. A concurrent ten-request probe also returned the same visible job ID in the response stream, although the shell capture method concatenated JSON responses and could not produce a clean machine-readable uniqueness count. Existing service and API tests cover the race-sensitive path; a future live probe should use separate output files per process or a proper HTTP harness.

## 5. Lifecycle, retry, DLQ, and recovery evidence

The existing server test suite covers retry backoff and jitter, DLQ threshold behavior, replay, stale processing recovery, job locks, recurring scheduling, queue priority, API behavior, and observability. The worker suite covers polling, concurrency ceilings, handler registry behavior, successful execution, unsupported handlers, unavailable locks, and missing PostgreSQL jobs.

A live unsupported-handler test with `maxRetries=1` produced one failed execution and a `FAILED` job. The implementation defines DLQ entry when `nextRetryCount > maxRetries`, meaning `maxRetries` is interpreted as the number of additional retries allowed after the first attempt. This should be stated prominently in operator documentation because some users interpret `maxRetries` as a total-attempt limit. A subsequent replay returned the job to `PENDING` and reset retry state as implemented by `retryJob`.

The worker executor performs the handler side effect before updating PostgreSQL to `COMPLETED`. Therefore, the following failure window remains real:

> Handler side effect succeeds → worker crashes before the PostgreSQL update → lease expires → job is recovered and may execute again.

This establishes an **at-least-once attempt model**. Effectively-once behavior requires idempotent handler side effects; the scheduler cannot guarantee exactly-once effects across an external system and PostgreSQL without a transactional integration boundary.

## 6. Distributed locking and crash-recovery analysis

Source inspection confirms job-scoped Redis locks with TTL and compare-and-delete release semantics. Workers also perform an atomic PostgreSQL `PENDING → RUNNING` conditional transition. Recovery only requeues a `RUNNING` job after its processing lease is stale and the Redis lock key is absent. This is a sensible conservative boundary: an active lock suppresses recovery even when the database lease is old.

The current handler registry contains one successful demo handler (`EMAIL_NOTIFICATION`) and placeholder handlers for `REPORT_GENERATION`, `WEBHOOK`, and `IMAGE_PROCESSING` that intentionally fail. That means realistic long-running contention and crash-window testing cannot be performed using an implemented slow handler without adding test-only or production handler behavior. Existing unit tests verify lock-unavailable short-circuiting, but the requested 2/5/10-worker live contention matrix was not executed in this audit.

**Finding F-03 — multi-worker and crash testing remains incomplete in the deployed environment.** Severity: Medium. The code has relevant mechanisms and unit tests, but the audit has not verified 2-, 5-, and 10-worker live contention or worker termination during a long-running side effect. The missing test is an evidence gap rather than a proven correctness defect.

**Recommendation.** Add a deterministic test handler behind an explicit benchmark/test configuration that sleeps for a controlled duration and records a unique side-effect token. Run the same job through 2, 5, and 10 workers, then terminate one process during execution and report lock attempts, successful acquisition, recovery timing, and duplicate side-effect observations.

## 7. Redis and PostgreSQL failure behavior

A controlled PostgreSQL stop caused `GET /api/v1/health` to return HTTP 503 with `status: degraded` and `postgresql: unhealthy`; after restart it returned HTTP 200 with both dependencies healthy. A Redis restart probe returned healthy responses before, during the short probe window, and after restart, likely because the Redis shutdown/restart interval was shorter than the service’s health probe timeout or the reconnect was already complete. This result is insufficient to claim full Redis outage semantics.

The health endpoint is dependency-aware and the Redis abstraction includes a bounded ping timeout. However, API write behavior during a Redis outage, scheduler behavior during Redis loss, and queued-job recovery after Redis restart were not exhaustively exercised in this audit.

**Finding F-04 — Redis outage semantics are not fully demonstrated.** Severity: Medium. Health behavior was not observed as degraded during the short Redis probe, and no controlled write/scheduler/worker failure matrix was completed.

**Recommendation.** Run a longer Redis outage with separate probes for job creation, queue enqueue, worker polling, scheduler polling, and reconnect recovery. Assert no silent loss: PostgreSQL job state must remain inspectable and any enqueue compensation path must be visible in logs or metrics.

## 8. Performance evidence

The repository contains a reproducible `scripts/load-test.mjs` harness. The measured local run used 2,000 `EMAIL_NOTIFICATION` jobs, one worker process, worker concurrency 20, 50 concurrent submissions, `maxRetries=0`, and a local PostgreSQL/Redis pair. Results were:

| Metric | Measured value |
|---|---:|
| Submitted | 2,000 |
| Completed | 2,000 |
| Failed | 0 |
| Duplicate execution rate | 0% |
| Submission throughput | 1,162.12 jobs/sec |
| End-to-end completion throughput | 12.94 jobs/sec |
| Execution duration p50/p95/p99 | 6 / 8 / 10 ms |

The benchmark report correctly separates submission throughput from completion throughput and execution duration from queue waiting time. It does not establish a production capacity limit, multi-worker scaling factor, Redis/PostgreSQL saturation point, or retry-storm behavior. These limitations are correctly documented in `docs/benchmarks/phase8-2000-jobs.md`.

## 9. Docker and deployment audit

The repository contains separate multi-stage Dockerfiles for API, worker, scheduler, and frontend, an Nginx configuration for the Vite SPA, a `.dockerignore`, versioned npm lockfile, PostgreSQL and Redis health checks, dependency conditions, persistent volumes, and Compose worker scaling documentation. The API, worker, and scheduler Dockerfiles run Prisma generation during the build stage. The frontend runtime uses an unprivileged Nginx image.

**Docker validation status: NOT EXECUTED.** The audit sandbox does not contain the Docker CLI, so `docker compose config`, `docker compose build --no-cache`, container networking, health checks, graceful shutdown, and multi-replica execution could not be validated. This must be treated as an open verification item, not as a pass.

**Finding F-05 — Docker reproducibility is configured but unverified.** Severity: Medium. The Compose file is structurally plausible and the service hostnames are environment-aware, but the requested clean Docker lifecycle has not run in this environment.

**Recommendation.** Run the documented sequence on a Docker-enabled host:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml build --no-cache
docker compose -f infra/docker-compose.yml up --scale worker=3
```

Then verify API health, frontend reachability, migrations, scheduler output, worker heartbeats, job completion, and worker restart recovery.

## 10. Severity-ranked findings

| ID | Severity | Finding | Current disposition |
|---|---|---|---|
| F-01 | Medium | Clean install requires explicit Prisma generation before build/typecheck. | Fix onboarding or automate generation. |
| F-02 | Low | Root formatting gate includes unformatted presentation artifacts. | Exclude/generated-format separately. |
| F-03 | Medium | 2/5/10-worker live contention and crash tests were not executed. | Add deterministic slow benchmark handler and run matrix. |
| F-04 | Medium | Redis outage semantics are not fully evidenced. | Run longer, component-specific outage matrix. |
| F-05 | Medium | Docker build and Compose startup are unverified because Docker is unavailable in the audit environment. | Validate on Docker-enabled host. |

## 11. Recommended next actions

First, make the developer path deterministic by automating or documenting Prisma generation immediately after dependency installation. Second, separate source quality gates from presentation artifact checks so a generated slide deck does not make the engineering format gate fail. Third, add a benchmark-only slow handler and run a live 2/5/10-worker contention and crash-recovery matrix. Fourth, perform a full Redis outage and restart test with explicit assertions for API writes, scheduling, worker processing, and state preservation. Finally, add a CI workflow that runs `npm ci`, Prisma generation, typecheck, build, lint, tests, and the lightweight API smoke matrix on every change.

## References

[1]: ../../README.md "PulseQ project README"
[2]: ../benchmarks/phase8-2000-jobs.md "Measured Phase 8 benchmark report"
[3]: ../../server/prisma/schema.prisma "Prisma schema"
[4]: ../../infra/docker-compose.yml "Docker Compose deployment"
[5]: ../../scripts/load-test.mjs "Reproducible load-test runner"
[6]: ../../docs/architecture-consistency.md "Consistency model documentation"
