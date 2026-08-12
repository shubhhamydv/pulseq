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

**No distributed systems functionality, job scheduling logic, or database integration is implemented in this version.**

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

## Backend Architecture

The backend has been refactored into a layered Express architecture:

- config: environment and application configuration
- controllers: request handling and response shaping
- services: application logic
- repositories: data-access boundary placeholders for future persistence
- middleware: request logging, validation, and centralized errors
- routes: route definitions for the current API surface
- utils: shared helpers and logging
- types: shared TypeScript interfaces

Requests flow through logging, routing, validation, controllers, services, repositories, and then back to the client. Failures are handled centrally through structured error middleware.

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
- [ ] PostgreSQL integration for persistence
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

## Contributing

See `docs/CONTRIBUTING.md` for contribution guidelines (to be created).

## License

(To be specified)

## Contact

For questions or issues, please open a GitHub issue or contact the development team.

---

**Last Updated**: August 2025
**Project Status**: Foundation Phase ✓ | Ready for Core Feature Development
