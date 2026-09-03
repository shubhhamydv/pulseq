# Run PulseQ

## Fastest local start

From this directory:

```bash
npm install
npm run docker:up
npm run prisma:generate
npm run dev
```

Open `http://localhost:5173`.

The API is at `http://localhost:3000`. Check it with:

```bash
curl http://localhost:3000/api/v1/health
```

## Stop services

Press `Ctrl+C` to stop the development processes, then run:

```bash
npm run docker:down
```

## Useful routes

- Dashboard: `http://localhost:5173/`
- Create Job: `http://localhost:5173/jobs/new`
- Architecture: `http://localhost:5173/architecture`
- Workers: `http://localhost:5173/workers`
- Metrics: `http://localhost:5173/metrics`
- DLQ: `http://localhost:5173/dlq`

## Windows PowerShell

```powershell
npm install
npm run docker:up
npm run prisma:generate
npm run dev
```

Docker Desktop must be running because PostgreSQL and Redis are provided by the local Compose stack.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

The archive intentionally excludes `node_modules`, `dist`, `.env`, and other local secrets. Run `npm install` after extraction and create local environment files from `.env.example` only if you need custom values.
