# Distributed Job Scheduler & Async Event Engine

A modern, production-ready monorepo for building a distributed job scheduling and asynchronous event processing system.

## Project Overview

The **Distributed Job Scheduler & Async Event Engine** is a comprehensive system designed to handle:

- **Job Scheduling**: Reliable, scalable job scheduling across distributed workers
- **Asynchronous Event Processing**: Non-blocking event handling with guaranteed delivery
- **Distributed Architecture**: Support for multiple workers, queues, and fault tolerance
- **Scalability**: Built to handle high-throughput, low-latency workloads

This project will eventually feature Redis for caching/queuing, PostgreSQL for persistence, worker pools, and enterprise-grade reliability patterns including retries, dead letter queues, and distributed locking.

## Current Scope

This initial version establishes **only the monorepo foundation**:

- ✅ Monorepo structure with npm workspaces
- ✅ Backend API with Express.js and TypeScript
- ✅ Frontend application with React, Vite, and TypeScript
- ✅ Development tooling (ESLint, Prettier, TypeScript)
- ✅ Health check endpoint for server verification
- ✅ Professional documentation and configuration

**Distributed workers, queues, scheduling, execution, and cancellation are not implemented yet; the current version includes the PostgreSQL jobs persistence layer and initial read/create REST API.**

## Architecture

The system follows a simple **Client → Server API** architecture:

```
┌────────────────┐
│   React SPA    │  (Port 5173)
│   (Frontend)   │
└────────┬───────┘
         │
         │ HTTP/REST API
         ▼
┌────────────────┐
│  Express.js    │  (Port 3000)
│   (Backend)    │
└────────────────┘
```

### Future Architecture Components

The following components will be introduced in future development phases:

- **Job Queue**: Redis-backed queue for job distribution
- **Worker Pools**: Distributed workers processing jobs from the queue
- **Database**: PostgreSQL for persistent state and job history
- **Event Bus**: Pub/Sub system for asynchronous event processing
- **Scheduler**: Cron and delayed job scheduling
- **Monitoring**: Health checks, metrics, and alerting
- **Fault Tolerance**: Retries, exponential backoff, circuit breakers
- **Distributed Locking**: Prevent concurrent execution of critical operations

## Repository Structure

```
.
├── server/                 # Backend API (Node.js + Express + TypeScript)
│   ├── src/
│   │   └── index.ts       # Express server and routes
│   ├── dist/              # Compiled output
│   ├── package.json       # Backend dependencies and scripts
│   ├── tsconfig.json      # TypeScript configuration
│   └── .env.example       # Example environment variables
│
├── client/                 # Frontend (React + Vite + TypeScript)
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── App.css        # Styling
│   │   └── main.tsx       # React entry point
│   ├── index.html         # HTML template
│   ├── dist/              # Build output
│   ├── package.json       # Frontend dependencies and scripts
│   ├── tsconfig.json      # TypeScript configuration
│   ├── vite.config.ts     # Vite configuration
│   └── .env.example       # Example environment variables
│
├── docs/                   # Project documentation
│   └── README.md          # Documentation index
│
├── infra/                  # Infrastructure configuration (placeholder)
│   └── README.md          # Infrastructure documentation
│
├── package.json            # Root monorepo configuration
├── tsconfig.json          # Root TypeScript configuration
├── eslint.config.js       # ESLint configuration
├── .prettierrc             # Prettier formatting rules
├── .prettierignore         # Files to ignore during formatting
├── .editorconfig          # Editor configuration
├── .gitignore             # Git ignore rules
└── README.md              # This file
```

## Prerequisites

- **Node.js**: v18.0.0 or later
- **npm**: v9.0.0 or later
- **Git**: For version control

### Verify Prerequisites

```bash
node --version      # Should be v18.0.0 or later
npm --version       # Should be v9.0.0 or later
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd distributed-job-scheduler
```

### 2. Install Dependencies

```bash
npm install
```

This command uses npm workspaces to install dependencies for both the server and client.

## Development

### Run Full Stack (Frontend + Backend)

```bash
npm run dev
```

This will start both the backend server (http://localhost:3000) and frontend application (http://localhost:5173) in parallel.

### Run Backend Only

```bash
npm run dev:backend
```

Starts the Express.js server on http://localhost:3000 with automatic reload on file changes.

### Run Frontend Only

```bash
npm run dev:frontend
```

Starts the Vite development server on http://localhost:5173.

### Preview Production Build

After building, preview the optimized frontend:

```bash
npm run build:frontend
npm run preview
```

## Validation & Quality Assurance

### Build

Build both backend and frontend:

```bash
npm run build
```

Or build individually:

```bash
npm run build:backend     # Compile TypeScript
npm run build:frontend    # Build optimized bundle
```

### Linting

Check code quality with ESLint:

```bash
npm run lint
```

ESLint checks for:

- TypeScript type errors
- React best practices and hooks
- Code style consistency
- Unused variables and imports

### Type Checking

Verify TypeScript types across the monorepo:

```bash
npm run typecheck
```

Or type-check individual packages:

```bash
npm run typecheck:backend
npm run typecheck:frontend
```

### Code Formatting

Format code with Prettier:

```bash
npm run format
```

Check if code is already formatted:

```bash
npm run format:check
```

## Health Check

The backend exposes a health check endpoint that can be used to verify the server is running.

### Check Server Health

**URL**: `GET http://localhost:3000/api/v1/health`

**Response** (HTTP 200):

```json
{
  "status": "ok",
  "timestamp": "2025-08-11T10:30:00.000Z"
}
```

### Using curl

```bash
curl http://localhost:3000/api/v1/health
```

### From Frontend

The frontend application automatically checks the server health on load and every 5 seconds, displaying the connection status in the UI.

## Development Workflow

### Typical Development Session

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start both backend and frontend:

   ```bash
   npm run dev
   ```

3. Open browser to http://localhost:5173

4. Edit files in `server/src` or `client/src` (hot reload enabled)

5. Run validation before committing:

   ```bash
   npm run typecheck
   npm run lint
   npm run format:check
   ```

6. Auto-format code if needed:
   ```bash
   npm run format
   ```

## Environment Configuration

### Server Configuration

Create `server/.env` based on `server/.env.example`:

```bash
cp server/.env.example server/.env
```

**Available variables**:

- `PORT` (default: `3000`): Server port
- `NODE_ENV` (default: `development`): Environment (development, production)

### Client Configuration

Create `client/.env` based on `client/.env.example`:

```bash
cp client/.env.example client/.env
```

**Available variables**:

- `VITE_API_URL` (default: `http://localhost:3000`): Backend API URL

## Project Standards

### Code Quality

- **Strict TypeScript**: All code must pass TypeScript strict mode
- **Consistent Formatting**: All code is formatted with Prettier (2-space indentation)
- **Linting**: All code must pass ESLint checks
- **No Console Warnings**: Build process fails on ESLint warnings

### Architecture Principles

- **Separation of Concerns**: Backend and frontend are independent packages
- **Scalability**: Code is structured to support future microservices
- **Type Safety**: Comprehensive TypeScript coverage
- **Minimal Dependencies**: Only essential packages are included

## Production Build

### Build for Production

```bash
npm run build
```

This creates optimized builds:

- **Backend**: Compiles TypeScript to `server/dist/`
- **Frontend**: Bundles React SPA to `client/dist/`

### Run Production Backend

```bash
cd server
npm run start
```

### Serve Production Frontend

The built frontend in `client/dist/` can be served by any static file server or CDN.

## Scripts Reference

### Root Level Commands

| Command                      | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `npm run dev`                | Start both frontend and backend in development mode |
| `npm run dev:backend`        | Start backend server with watch mode                |
| `npm run dev:frontend`       | Start Vite dev server                               |
| `npm run build`              | Build both backend and frontend                     |
| `npm run build:backend`      | Compile backend TypeScript                          |
| `npm run build:frontend`     | Build frontend bundle                               |
| `npm run preview`            | Preview production build                            |
| `npm run lint`               | Run ESLint across monorepo                          |
| `npm run format`             | Format code with Prettier                           |
| `npm run format:check`       | Check if code is formatted                          |
| `npm run typecheck`          | Run TypeScript type checking                        |
| `npm run typecheck:backend`  | Type check backend only                             |
| `npm run typecheck:frontend` | Type check frontend only                            |

### Backend Commands (in `server/`)

| Command             | Purpose                      |
| ------------------- | ---------------------------- |
| `npm run dev`       | Start server with watch mode |
| `npm run build`     | Compile TypeScript           |
| `npm run start`     | Run compiled server          |
| `npm run typecheck` | Type check backend           |

### Frontend Commands (in `client/`)

| Command             | Purpose                 |
| ------------------- | ----------------------- |
| `npm run dev`       | Start Vite dev server   |
| `npm run build`     | Build production bundle |
| `npm run preview`   | Preview build           |
| `npm run typecheck` | Type check frontend     |

## Troubleshooting

### Port Already in Use

If port 3000 (backend) or 5173 (frontend) is already in use:

**Backend**: Set the `PORT` environment variable

```bash
PORT=3001 npm run dev:backend
```

**Frontend**: Vite will automatically use the next available port

### Node Modules Corruption

If you encounter module errors, reinstall dependencies:

```bash
rm -r node_modules server/node_modules client/node_modules
npm install
```

### TypeScript Errors

Ensure TypeScript is up to date:

```bash
npm run typecheck
```

Clear any `.tsbuildinfo` cache files if needed.

### ESLint Errors

Auto-fix fixable errors:

```bash
npm run lint -- --fix
```

## Future Roadmap

### Phase 2: Core Job Scheduling

- [ ] Job queue implementation with Redis
- [ ] Worker pool architecture
- [ ] Job status tracking and history
- [ ] Basic dashboard for job monitoring

### Phase 3: Advanced Features

- [ ] Asynchronous event processing
- [x] PostgreSQL integration for persistence
- [ ] Distributed locking mechanism
- [ ] Retry logic with exponential backoff
- [ ] Dead letter queue (DLQ) handling

### Phase 4: Production Hardening

- [ ] Authentication and authorization
- [ ] Comprehensive logging and monitoring
- [ ] Metrics and observability
- [ ] Docker and Kubernetes support
- [ ] Load testing and performance optimization
- [ ] High-availability configuration

### Phase 5: Enterprise Features

- [ ] Cron job support
- [ ] Scheduled job execution
- [ ] Circuit breaker pattern
- [ ] Graceful degradation
- [ ] Distributed tracing
- [ ] Rate limiting and throttling

## Jobs Persistence Layer

The backend now includes a PostgreSQL `jobs` model managed by Prisma. The model stores the job type and JSON payload together with lifecycle status, priority, scheduled time, retry metadata, error information, and automatically maintained timestamps. The schema defines indexes for `status`, `priority`, and `scheduledAt`.

Database access is isolated in `server/src/repositories/jobs.repository.ts`. The typed repository exposes `createJob`, `findJobById`, `listJobs`, `updateJob`, and `cancelJob`; cancellation updates the status to `CANCELLED` and preserves the record. Queueing, scheduling, workers, and job execution remain outside the scope of this layer.

To create and apply the migration, configure `DATABASE_URL` and run:

```bash
npm run db:generate --workspace=server
npm run db:migrate --workspace=server -- --name add_jobs
```

The repository integration tests use the configured PostgreSQL database and can be run with:

```bash
npm run test --workspace=server
```

## Job Management API

The backend exposes the initial job-management API without workers, queues, scheduling, Redis, execution, or cancellation behavior.

| Method | Path                           | Purpose                                                         |
| ------ | ------------------------------ | --------------------------------------------------------------- |
| `POST` | `/api/v1/jobs`                 | Create a persisted job with server-controlled `PENDING` status. |
| `GET`  | `/api/v1/jobs/:id`             | Retrieve one job by its generated ID.                           |
| `GET`  | `/api/v1/jobs?page=1&limit=20` | List jobs using database-level pagination.                      |

`POST /api/v1/jobs` accepts a non-empty `jobType`, a JSON object `payload`, and optional `scheduledAt` ISO date, integer `priority` from 0 through 100, and integer `maxRetries` from 0 through 100. The response is `201 Created` and includes the persisted job, including generated identifiers and timestamps. Invalid input returns `400` with a validation error; missing jobs return `404`.

The list endpoint defaults to page 1 and limit 20, validates page values as positive integers, bounds limit to 1–100, and returns `data` together with `pagination.page`, `pagination.limit`, `pagination.total`, and `pagination.totalPages`. Pagination is executed through Prisma `take`, `skip`, and `count` operations rather than in memory.

## Redis Infrastructure

Redis is included as an infrastructure foundation for future queues and workers; this phase does not implement job queues, workers, scheduling, execution, retries, streams, pub/sub, or distributed locking. Start the local PostgreSQL and Redis services with:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Configure the backend with `REDIS_URL`, using `server/.env.example` as the template. The Redis implementation is isolated in `server/src/infrastructure/redis/redis.service.ts`; application routes and business services do not import `ioredis` directly. The service uses bounded reconnect delays, structured Pino lifecycle logs, connectivity pings, and graceful disconnection.

`GET /api/v1/health` independently checks PostgreSQL and Redis. When both are reachable it returns HTTP `200` with `status: "ok"` and healthy dependency values. If either dependency is unavailable it returns HTTP `503` with `status: "degraded"` and identifies the unhealthy dependency without exposing credentials or internal connection details.

On `SIGINT` or `SIGTERM`, the backend stops accepting requests, closes Redis, disconnects Prisma, and exits cleanly.

## Phase 3 Worker Coordination and Execution History

The worker now reads `WORKER_CONCURRENCY` with a validated default of `10` and uses an explicit in-flight set to ensure no more than the configured number of handlers execute simultaneously. It continues polling while active jobs run and drains in-flight work during shutdown.

Each worker receives a unique ID, acquires `lock:job:<jobId>` with Redis `SET NX PX`, and releases only its own lock through an atomic compare-and-delete operation. A lock holder then conditionally claims `PENDING` to `RUNNING` in PostgreSQL before invoking a handler. This Redis-plus-PostgreSQL sequence prevents duplicate claims in the tested multi-worker race; it is not an exactly-once guarantee across crashes or failures after handler execution and before durable completion.

Successful attempts become `COMPLETED`, failed attempts become `FAILED`, and locks are released in exception-safe cleanup. The `execution_logs` table stores one record per attempt with worker ID, timestamps, duration, outcome, and error. Execution history is available from `GET /api/v1/jobs/:id/executions`, ordered by `startedAt` ascending and then ID.

## First Worker Process

The project now includes a separate `worker/` Node.js workspace that is independently started with:

```bash
npm run worker:dev
```

Start PostgreSQL and Redis first, then create a scheduled job using `POST /api/v1/jobs`. The worker polls Redis `jobs:scheduled` through `SchedulerQueue`, removes each selected ID, retrieves the job from PostgreSQL through the existing repository, resolves a handler from the registry, and updates the job through `RUNNING` to `COMPLETED` or `FAILED`.

The supported job types are `EMAIL_NOTIFICATION`, `REPORT_GENERATION`, `WEBHOOK`, and `IMAGE_PROCESSING`. Only `EMAIL_NOTIFICATION` currently has a deterministic demo handler; it logs successful execution without external services. The other three types are registered placeholders and are marked failed when selected. Missing PostgreSQL jobs and individual handler failures are logged and do not terminate the polling loop.

The worker uses a bounded batch size and waits between polling cycles when no work is available. On `SIGINT` or `SIGTERM`, it stops polling, drains active work, closes Redis, disconnects Prisma, and exits cleanly. Advanced retries, lock renewal, real external handlers, and multi-worker coordination beyond the shared lock are intentionally not implemented.

## Job Creation Scheduling Pipeline

`POST /api/v1/jobs` now coordinates PostgreSQL and Redis through the service layer. The service first persists the job with `PENDING` status, then enqueues the persisted ID through `SchedulerQueue` using the job’s `scheduledAt` timestamp. The API returns `201 Created` only after both operations succeed.

If Redis scheduling fails, the service logs structured context, removes any possibly enqueued Redis member, compensates by deleting the PostgreSQL record, and returns a sanitized `503 Service Unavailable` response. If PostgreSQL creation fails, Redis is not called. This is a practical application-level compensation strategy rather than a distributed transaction.

## Scheduled Job Queue

The Day 8 queue stores scheduled job IDs in the Redis Sorted Set `jobs:scheduled`. Each member is a job ID and each score is `scheduledAt` as a Unix timestamp in milliseconds. This keeps Redis storage compact and lets Redis return due members in deterministic timestamp order.

Conceptually:

```text
jobs:scheduled

job-A → 1755172800000
job-B → 1755172860000
job-C → 1755173000000
```

`SchedulerQueue.enqueue(jobId, scheduledAt)` adds or updates one member, `getDueJobs(limit)` returns up to the requested number of IDs whose scores are less than or equal to the current time, and `remove(jobId)` removes a member safely when present or absent. The queue uses the Day 7 Redis abstraction and does not retrieve PostgreSQL jobs, change job status, execute payloads, or start workers. Future workers will consume due IDs in a later phase.

## Job Cancellation and State Transitions

Jobs can be cancelled with `POST /api/v1/jobs/:id/cancel`. The endpoint returns the updated job with HTTP `200` and preserves the record for subsequent retrieval. A missing job returns `404`, while an invalid state transition returns `409` with an `Invalid State Transition` error.

The current state model is explicit. `PENDING` may transition to `RUNNING` or `CANCELLED`; `RUNNING` may transition to `COMPLETED`, `FAILED`, or `CANCELLED`; and `COMPLETED`, `FAILED`, and `CANCELLED` are terminal states. Therefore, completed or failed jobs cannot be cancelled, and terminal jobs cannot transition back to `RUNNING`. The service layer enforces these rules, while cancellation persistence uses an expected-status database update to avoid overwriting a concurrent state change.

## Contributing

See `docs/CONTRIBUTING.md` for contribution guidelines (to be created).

## License

(To be specified)

## Contact

For questions or issues, please open a GitHub issue or contact the development team.

---

**Last Updated**: August 2025
**Project Status**: Foundation Phase ✓ | Ready for Core Feature Development

## Phase 4 Failure Handling

### Retries

A failed worker attempt increments `retryCount`, preserves the latest error in `lastError`, clears the processing lease, and returns the job to `PENDING` with a future `scheduledAt`. The default `maxRetries` is `3`, while `RETRY_BASE_DELAY_MS` defaults to `1000` and `RETRY_JITTER_MS` defaults to `250`. The retry delay is `baseDelayMs * 2^retryCount + jitter`, where jitter is an additive integer in the inclusive lower and exclusive upper range `[0, jitterMs)` produced by an injectable random source in tests. A retry is reinserted into `jobs:scheduled` through `SchedulerQueue`.

### Dead Letter Queue

When the next failure would exceed `maxRetries`, the job remains available in PostgreSQL with status `FAILED`, its final error is persisted, and its ID is added idempotently to the Redis Set `jobs:dlq`. No future scheduled entry is created. The final execution attempt is recorded and the worker lock is released. `GET /api/v1/jobs/dlq` returns the current DLQ jobs through the service layer.

### Manual replay

`POST /api/v1/jobs/:id/retry` replays a failed job by conditionally resetting it to `PENDING`, setting `retryCount` to zero, clearing `lastError` and the processing lease, removing its DLQ membership, and reinserting it into `jobs:scheduled`. Redis Set and Sorted Set semantics make repeated replay requests idempotent at the queue-member level. A job that is missing or not in a replayable failed state returns the existing not-found or conflict response conventions.

### Worker crash recovery

The worker persists `processingStartedAt` when it atomically claims a job. `WORKER_PROCESSING_LEASE_MS` defaults to `60000`. The recovery process considers a `RUNNING` job stale only after that lease has elapsed and the Redis ownership key `lock:job:<jobId>` is absent. A live lock indicates a slow or legitimately long-running worker, so the job is not recovered prematurely. A stale job is conditionally returned to `PENDING`, its lease is cleared, and it is reinserted into the scheduled queue. Recovery is safe under concurrent attempts because the state update requires `RUNNING`.

This is an at-least-once failure model rather than an exactly-once guarantee. A crash after handler side effects but before durable completion can result in a later retry; external handlers must therefore be idempotent. Lock TTL and processing lease values should be selected for the expected workload, and lease renewal is intentionally outside the current scope.

## Phase 5 Production Scheduling

Recurring definitions are stored separately in `recurring_jobs`. The independent scheduler workspace (`npm run scheduler:dev`) validates cron expressions, uses a distributed per-definition lock, atomically advances `nextRunAt`, creates one ordinary `jobs` execution record, and enqueues that execution. Multiple scheduler replicas therefore race safely on the PostgreSQL due-condition and only one generates each occurrence. A recurring definition is not itself an execution.

Due-job selection preserves the distinction between eligibility and priority. `jobs:scheduled` stores the eligibility timestamp, while `jobs:priority` stores the current priority index. The queue selects due candidates first, then orders them by descending priority, ascending scheduled timestamp, and ID. A future high-priority job cannot bypass an already-due lower-priority job, and retry/backoff timestamps remain authoritative.

Job creation accepts the optional `Idempotency-Key` header. The key is stored in PostgreSQL with a unique constraint. The service performs a fast existing-key lookup and also handles a database uniqueness race by returning the row committed by the concurrent request. Requests without the header retain the existing behavior.

### Consistency model

This architecture is **effectively-once-oriented**, not a true exactly-once distributed execution system. Redis locks, PostgreSQL conditional claims, idempotency keys, retries, leases, and execution logs reduce duplicate attempts and allow business handlers to be made idempotent, but they cannot atomically commit an external side effect and PostgreSQL state across a worker crash or network partition. The execution guarantee is therefore at-least-once under recovery, while the business-effect guarantee can approach effectively-once only when handlers use an idempotency key or an equivalent durable deduplication record.

A worker crash after claiming but before completion can lead to a later recovery and another attempt. Redis loss can remove scheduling or lock state, while PostgreSQL remains the durable job source but cannot by itself reconstruct every transient Redis queue membership without a reconciliation process. PostgreSQL loss can prevent claims, completion, retry, DLQ, and idempotency updates. Lock expiration can allow a second worker to proceed while the first is still running if the lease is too short; selecting a lease longer than expected execution time and making effects idempotent reduces this risk. These are documented failure windows rather than hidden exactly-once claims.

## Phase 6 Observability

The API exposes Prometheus-compatible metrics at `GET /metrics`. Counters include submitted, completed, failed, retried, and lock-acquisition-failure totals. Gauges expose scheduled queue depth, active jobs, worker count, and DLQ size. Execution latency is emitted as a histogram in seconds. Job-type labels are bounded to configured job types; payloads, credentials, tokens, and full job bodies are never included in metrics or logs.

Operational JSON views are available at `GET /api/v1/metrics/queue`, `GET /api/v1/metrics/workers`, and `GET /api/v1/metrics/jobs`. Queue metrics use Redis cardinality and a PostgreSQL running-job count. Worker metrics enumerate the `workers:registry` set and read `workers:<workerId>` hashes. A worker is marked `stale` when its `lastHeartbeat` exceeds `WORKER_HEARTBEAT_TIMEOUT_MS`; a single delayed heartbeat does not delete its record or claim that the process is dead.

Workers register with Redis at startup and refresh `lastHeartbeat`, `activeJobs`, and `status` at `WORKER_HEARTBEAT_INTERVAL_MS`. Shutdown changes the worker to `stopping`, waits for active work, and removes its registry entry and hash. Defaults are a five-second heartbeat interval and a twenty-second stale threshold, both configurable through environment variables.

HTTP requests receive or preserve an `X-Request-ID` header. Pino emits structured JSON request logs containing the correlation ID, method, path, status, and duration. Job execution logs include `jobId`, `workerId`, `jobType`, `attempt`, `duration`, and `status`, but do not log payload contents or secrets.

Example successful execution log:

```json
{
  "level": 30,
  "jobId": "job-123",
  "workerId": "worker-01",
  "jobType": "EMAIL_NOTIFICATION",
  "attempt": 1,
  "duration": 1842,
  "status": "completed",
  "msg": "Job execution completed"
}
```

Example failed retry log:

```json
{
  "level": 50,
  "jobId": "job-123",
  "workerId": "worker-01",
  "jobType": "REPORT_GENERATION",
  "attempt": 2,
  "duration": 231,
  "status": "retrying",
  "error": "handler failed",
  "msg": "Job execution failed"
}
```

## Phase 8 Final Deployment and Portfolio Guide

The final local distributed deployment is defined in `infra/docker-compose.yml` and includes PostgreSQL, Redis, the API, recurring scheduler, worker service, and React frontend. From a clean checkout with Docker Compose installed:

```bash
cd infra
docker compose up --build
```

The frontend is available at `http://localhost:5173`, the API at `http://localhost:3000`, and the API health endpoint is `http://localhost:3000/api/v1/health`. Compose supports multiple worker replicas with:

```bash
docker compose up --build --scale worker=3
```

The deployment uses multi-stage Dockerfiles, Alpine runtime images, non-root application users where supported, persistent PostgreSQL/Redis volumes, service health checks, and dependency conditions. Docker builds intentionally do not copy `.env` files or local dependency directories. Configure credentials through Compose environment variables or an uncommitted `.env` file.

The final architecture is available as both Mermaid source and rendered PNG at `docs/architecture-final.mmd` and `docs/architecture-final.png`. The measured load-test report is at `docs/benchmarks/phase8-2000-jobs.md`, with the reproducible runner at `scripts/load-test.mjs`. The benchmark reports submission throughput, completion throughput, execution-duration percentiles, failure rate, and duplicate execution rate separately. It does not claim a universal capacity ceiling or true exactly-once execution.

### Final technology roles

| Technology                    | Role in this system                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| Node.js and TypeScript        | Typed API, worker, scheduler, and shared service implementation.                                       |
| Express                       | REST job-management, monitoring, health, metrics, and replay endpoints.                                |
| React, Vite, and Recharts     | Responsive engineering dashboard for operations and telemetry.                                         |
| PostgreSQL and Prisma         | Durable job definitions, state transitions, recurring definitions, idempotency, and execution history. |
| Redis                         | Due-time and priority scheduling, distributed locks, DLQ membership, and worker heartbeats.            |
| Docker Compose                | Reproducible local distributed execution with replaceable worker replicas.                             |
| Pino                          | Structured production logging with request and execution context.                                      |
| Prometheus-compatible metrics | Scrapeable counters, gauges, and execution-latency histograms.                                         |

The central consistency boundary remains explicitly documented: the system favors recoverable at-least-once attempts and can provide effectively-once business behavior when handlers implement durable idempotency. It does not claim a cross-system exactly-once guarantee.

## Windows Clean Setup and Startup

Run all npm commands from the repository root, not from `server`, `worker`, `scheduler`, or `client` individually. The root workspace installation installs each workspace's development dependencies, including `ts-node` and Vite, and the root `postinstall` hook automatically generates the Prisma client.

PowerShell setup:

```powershell
cd C:\Users\<your-user>\Downloads\distributed-job-scheduler-final
node --version
npm --version
npm install
```

Use Node.js 22 LTS or another supported Node.js version. The project declares Node.js `>=18` and npm `>=9`. If this folder was copied from an earlier incomplete installation, remove stale dependencies first:

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Get-ChildItem -Directory -Recurse -Filter node_modules | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
npm install
npm run prisma:generate
```

Before starting the application, ensure PostgreSQL and Redis are running and copy the environment template if needed:

```powershell
Copy-Item server\.env.example server\.env
```

Update `server\.env` if the local PostgreSQL username, password, database name, or Redis port differs from the documented defaults. Then apply the Prisma migrations:

```powershell
npx prisma migrate deploy --schema server\prisma\schema.prisma
```

Verify the installation before starting development processes:

```powershell
npm run prisma:generate
npm run typecheck
npm run build
```

Start the complete development system from the root:

```powershell
npm run dev
```

This starts the API, worker, recurring scheduler, and Vite frontend through npm workspaces. If you prefer separate terminals, use:

```powershell
npm run dev:backend
npm run worker:dev
npm run scheduler:dev
npm run dev:frontend
```

The API is available at `http://localhost:3000`, the health check is `http://localhost:3000/api/v1/health`, and the frontend is available at the Vite URL printed in the terminal, normally `http://localhost:5173`.

The errors `Cannot find package 'ts-node'` and `'vite' is not recognized` mean dependencies were not installed in the workspace root or the command was run from an incomplete extracted directory. They are not application-code errors. Running `npm install` once from the root fixes both missing executables; the automatic Prisma generation hook fixes missing generated model types.

## Live Demo on Render

PulseQ can be deployed as a real end-to-end public demo on Render using the included `render.yaml` Blueprint. The Blueprint provisions a public API, static React frontend, scheduler background worker, execution worker, Render Postgres database, Render Key Value instance for Redis-compatible queue state, and an hourly cleanup cron job.

### Deployment steps

1. Push the repository to GitHub with `render.yaml` at the repository root.
2. In the Render Dashboard, select **New → Blueprint** and connect the repository.
3. Select the region for the project. Keep all PulseQ services in the same region so the private service references stay close to the API, database, queue, scheduler, and workers.
4. Apply the Blueprint. Render will request the two `sync: false` values for the API: `CORS_ORIGINS` and `FRONTEND_URL`.
5. After the first deploy, copy the public frontend URL and API URL from Render. Set `CORS_ORIGINS` and `FRONTEND_URL` on `pulseq-api` to the frontend URL, and set `VITE_API_URL` on `pulseq-frontend` to the API URL.
6. Redeploy the API and frontend after saving those values.
7. Confirm `https://<api-host>/api/v1/health` returns a healthy dependency-aware response before opening the frontend.

### Public-demo environment variables

| Variable                  | Purpose                                 | Recommended value   |
| ------------------------- | --------------------------------------- | ------------------- |
| `DEMO_MODE`               | Enables the public job guard            | `true`              |
| `CORS_ORIGINS`            | Comma-separated allowed browser origins | Frontend Render URL |
| `FRONTEND_URL`            | Canonical frontend origin               | Frontend Render URL |
| `REQUEST_BODY_LIMIT`      | Express request body ceiling            | `64kb`              |
| `DEMO_RATE_WINDOW_MS`     | Per-client rate-limit window            | `60000`             |
| `DEMO_RATE_LIMIT`         | Maximum create requests per window      | `10`                |
| `DEMO_MAX_RETRIES`        | Public retry ceiling                    | `5`                 |
| `DEMO_MAX_PAYLOAD_BYTES`  | Public JSON payload ceiling             | `10240`             |
| `DEMO_RETENTION_HOURS`    | Demo-data retention period              | `24`                |
| `DEMO_CLEANUP_BATCH_SIZE` | Maximum cleanup deletions per cron run  | `500`               |

`DATABASE_URL` and `REDIS_URL` are supplied to the services through Render Postgres and Key Value references in `render.yaml`. Worker, scheduler, and API services share the same database and Redis connection values.

### Public-demo security measures

When `DEMO_MODE=true`, job creation accepts only the allowlisted worker-registered types `EMAIL_NOTIFICATION`, `REPORT_GENERATION`, `WEBHOOK`, and `IMAGE_PROCESSING`. Requests are limited by client IP, body size, payload size, and maximum retries. Demo payloads are tagged with `__pulseqDemo=true` so cleanup can target them precisely. The public demo does not expose arbitrary shell execution, arbitrary code execution, unrestricted job-handler registration, or direct Redis access.

CORS is unrestricted only during non-production development when no origin list is configured. Production requests with an `Origin` header must match `CORS_ORIGINS`. Error responses use safe public messages in production, while request IDs remain available for correlation in logs.

### Cleanup strategy

The `pulseq-demo-cleanup` Render cron job runs hourly. It selects only jobs tagged with `__pulseqDemo=true` and older than `DEMO_RETENTION_HOURS`, removes their scheduled, priority, and DLQ Redis membership, and deletes the PostgreSQL job rows. Execution logs are removed through the existing cascade relationship. Cleanup is bounded by `DEMO_CLEANUP_BATCH_SIZE` and can be safely repeated.

### Recruiter demo workflow

Open the frontend dashboard, read the live queue and worker telemetry, choose **Jobs → Create job**, select the `EMAIL_NOTIFICATION · success path` preset, and submit it. Open the resulting job detail page to watch the actual job state and execution attempts refresh every five seconds. To demonstrate recovery, choose a failure-path preset, inspect the recorded failed attempts, open the DLQ when the retry policy is exhausted, and use **Replay job**. The Architecture page explains how the React client, Express API, PostgreSQL, Redis, scheduler, and workers connect.

The frontend intentionally displays backend-unavailable states rather than fabricating workers, metrics, queue depth, or execution results. A working public demo therefore requires the Render services and their dependencies to be healthy.

### Local testing

```bash
npm install
npm run docker:up
npm run prisma:generate
npm run dev
```

For production-style checks:

```bash
npm run typecheck
npm run lint
npm run build
```

To validate the Blueprint with the Render CLI, install a current Render CLI and run:

```bash
render blueprints validate render.yaml
```

### Limitations and tradeoffs

The in-memory public-demo rate limiter is intentionally lightweight and protects each API instance independently. For multi-instance public scaling, replace it with a Redis-backed limiter. The current dashboard uses reliable polling rather than adding a WebSocket or Server-Sent Events protocol, which avoids introducing a new realtime backend contract. The existing worker registry includes successful email handling and deliberate placeholder failure handlers; the public presets expose this honestly so retry and DLQ behavior are real rather than simulated.

## Production Prometheus Metrics

PulseQ exposes a standard Prometheus exposition endpoint at `GET /metrics`. The existing JSON monitoring endpoints under `/api/v1/metrics/*` remain available and unchanged. The API also exposes lightweight liveness and dependency readiness endpoints at `GET /health` and `GET /ready`, while the existing dependency-aware endpoint remains available at `GET /api/v1/health`.

The Prometheus registry includes the following application metrics:

| Metric                                    | Type      | Meaning                                                                                              |
| ----------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| `scheduler_jobs_processed_total`          | Counter   | Successfully processed jobs, labelled by `queue`, `job_type`, and `status`.                          |
| `scheduler_jobs_failed_total`             | Counter   | Failed job executions, labelled by `queue`, `job_type`, and `status`.                                |
| `scheduler_jobs_enqueued_total`           | Counter   | Jobs successfully added to the Redis scheduler queue, labelled by `queue`, `job_type`, and `status`. |
| `scheduler_job_execution_time_seconds`    | Histogram | Job execution duration for successful, failed, and retrying executions.                              |
| `scheduler_queue_pending`                 | Gauge     | Pending non-retry jobs in the scheduled queue.                                                       |
| `scheduler_queue_processing`              | Gauge     | Jobs currently in `RUNNING` state.                                                                   |
| `scheduler_queue_retry`                   | Gauge     | Pending jobs with at least one retry attempt.                                                        |
| `scheduler_queue_dead_letter`             | Gauge     | Jobs currently in the Redis dead-letter set.                                                         |
| `scheduler_http_requests_total`           | Counter   | HTTP requests labelled by method, normalized route, and status code.                                 |
| `scheduler_http_request_duration_seconds` | Histogram | HTTP request duration labelled by method, normalized route, and status code.                         |

Default Node.js runtime metrics are enabled through `prom-client`, including process CPU, memory, event-loop, garbage-collection, and active-resource metrics where supported by the installed Node.js runtime. Raw request URLs are never used as route labels; unmatched paths are grouped under `unmatched` to avoid high-cardinality series.

### Verify `/metrics`

Start the API with its PostgreSQL and Redis dependencies, then run:

```bash
curl -i http://localhost:3000/metrics
curl http://localhost:3000/metrics | grep scheduler_jobs_processed_total
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

The response should have HTTP status `200`, a `text/plain` Prometheus content type, `# HELP` and `# TYPE` declarations, and metric samples such as `scheduler_jobs_enqueued_total` and `scheduler_job_execution_time_seconds_count`.

### Run Prometheus locally

Create a local `prometheus.yml` beside the project:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: pulseq-api
    metrics_path: /metrics
    static_configs:
      - targets: ['host.docker.internal:3000']
```

Run Prometheus with Docker on macOS or Windows using:

```bash
docker run --rm -p 9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" \
  prom/prometheus
```

On Linux, replace `host.docker.internal:3000` with an address reachable from the Prometheus container, or add `--add-host=host.docker.internal:host-gateway` to the `docker run` command. Open `http://localhost:9090` and query `scheduler_jobs_processed_total`, `scheduler_queue_pending`, or `scheduler_http_request_duration_seconds`.

## GitHub Actions CI/CD

The repository includes `.github/workflows/ci.yml`, which validates the Node.js workspaces, runs tests against real PostgreSQL and Redis service containers, builds the production images, and publishes them to GitHub Container Registry (GHCR) after successful pushes. Pull requests perform the complete validation and Docker build, but do not publish images.

The workflow uses Node.js 20, which satisfies the repository’s declared Node.js requirement of version 18 or later. It runs `npm ci`, Prisma client generation and migrations, linting, Prettier’s check mode, workspace type-checking, the existing test command, and a high-severity dependency audit. No MongoDB service is configured because Pulse-Q uses PostgreSQL through Prisma and Redis through ioredis; the CI services therefore match the actual application architecture.

### Triggers and image names

The workflow runs for every branch push, version tag matching `v*.*.*`, and pull request. Images are named as follows:

| Service   | GHCR image                         |
| --------- | ---------------------------------- |
| API       | `ghcr.io/<owner>/pulseq-api`       |
| Worker    | `ghcr.io/<owner>/pulseq-worker`    |
| Scheduler | `ghcr.io/<owner>/pulseq-scheduler` |
| Frontend  | `ghcr.io/<owner>/pulseq-frontend`  |

Each published image receives a long commit-SHA tag. Branch and version-reference tags are also generated when applicable, and `latest` is generated only for the repository’s default branch. The workflow never relies on `latest` as the only tag.

### Required GitHub secrets

No manually created registry secret is required for GHCR. The workflow uses the automatically provided `GITHUB_TOKEN`, with the job-level `packages: write` permission, to authenticate and publish images owned by the repository. If the repository organization restricts `GITHUB_TOKEN` package publishing, enable that permission in the repository Actions settings or replace the login credentials with an organization-approved package token stored as a GitHub Actions secret.

### Local reproduction

Run the same validation stages locally from the repository root:

```bash
npm ci
npm run prisma:generate
cat > .env <<'EOF'
DATABASE_URL=postgresql://jobs:jobs@localhost:5432/jobs?schema=public
REDIS_URL=redis://localhost:6379
NODE_ENV=test
EOF
cp .env server/.env
DATABASE_URL='postgresql://jobs:jobs@localhost:5432/jobs?schema=public' npx prisma migrate deploy --schema server/prisma/schema.prisma
npm run lint
npm run format:check
npm run typecheck
DATABASE_URL='postgresql://jobs:jobs@localhost:5432/jobs?schema=public' REDIS_URL='redis://localhost:6379' NODE_ENV=test npm test
npm audit --omit=dev --audit-level=high
```

Start matching local dependencies with Docker Compose before the migration and test commands:

```bash
docker compose up -d postgres redis
until docker compose exec -T postgres pg_isready -U jobs -d jobs; do sleep 2; done
until docker compose exec -T redis redis-cli ping | grep -q PONG; do sleep 2; done
```

Build the same production images without publishing them:

```bash
docker build -f Dockerfile.api -t pulseq-api:local .
docker build -f Dockerfile.worker -t pulseq-worker:local .
docker build -f Dockerfile.scheduler -t pulseq-scheduler:local .
docker build -f Dockerfile.frontend -t pulseq-frontend:local .
```

### Failure and security behavior

Validation is a prerequisite for the Docker job, so a failed lint, type-check, test, migration, audit, or formatting check prevents image builds and publication. A Docker build failure prevents publication of that image and causes the summary job to fail. The workflow does not hardcode database credentials, registry credentials, tokens, or API keys; CI uses ephemeral service-container credentials and the GitHub-provided token. Docker layers are cached with GitHub Actions cache scopes per service to reduce repeat build time.

The workflow does not expose application payloads or credentials in metrics or image tags. Before enabling publication for a fork or an untrusted workflow, review repository Actions permissions and ensure that only trusted push events can access package-write credentials.

## Production Observability

PulseQ now uses a centralized redacted Pino logger and OpenTelemetry Node.js tracing. Structured logs include service, environment, event, request/job/worker identifiers, and durations; active spans also provide trace and span identifiers. Passwords, tokens, authorization headers, API keys, database and Redis connection strings, request bodies, and job payloads are redacted or excluded.

The API initializes OpenTelemetry before Express. HTTP, Express, and ioredis instrumentation are enabled. Job creation persists `requestId`, `traceparent`, and `tracestate` on the job row. The worker extracts that W3C context and creates a `pulseq.worker.process` span with `pulseq.job.id`, `pulseq.job.type`, and `pulseq.worker.id` attributes. This is an explicit asynchronous correlation mechanism: the original HTTP span is not kept open while a delayed job executes.

### Jaeger quick start

Start the stack with `npm run docker:up`. Jaeger UI is available at [http://localhost:16686](http://localhost:16686), and OTLP/HTTP is exposed at `http://localhost:4318`. Generate a trace with:

```bash
curl -i -X POST http://localhost:3000/api/v1/jobs \
  -H 'Content-Type: application/json' \
  -H 'X-Request-ID: demo-request-001' \
  -d '{"jobType":"EMAIL_NOTIFICATION","payload":{"to":"demo@example.com"}}'
```

In Jaeger, select `pulseq-api`, open the POST trace, and look for the linked `pulseq.worker.process` span under `pulseq-worker`. Search by the returned job ID or the `pulseq.job.id` attribute.

### Environment variables

| Variable                      |                 Default | Purpose                                                         |
| ----------------------------- | ----------------------: | --------------------------------------------------------------- |
| `OTEL_ENABLED`                |                  `true` | Enables or disables telemetry startup.                          |
| `OTEL_SERVICE_NAME`           |        process-specific | Service name shown in Jaeger.                                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | OTLP/HTTP collector base URL.                                   |
| `OTEL_TRACES_SAMPLER`         |             SDK default | Use `parentbased_traceidratio` for bounded production sampling. |
| `OTEL_TRACES_SAMPLER_ARG`     |        `0.1` in Compose | Sampling ratio when supported by the selected sampler.          |

Apply the correlation migration before using this feature against an existing database:

```bash
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

### Validation and limitations

Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`. Automatic database instrumentation for Prisma is not included in this change; application spans and existing metrics remain available, while explicit repository spans can be added if per-query database visibility is required. Sampling may omit traces, so the persisted `requestId` plus `jobId` is the durable fallback correlation mechanism.
