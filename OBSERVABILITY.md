# Pulse-Q local observability environment

## Architecture

```text
Browser -> frontend -> api -> PostgreSQL
                         |       
                         +-----> Redis <----- scheduler
                         |                 
                         +-----> worker ----> PostgreSQL

Prometheus --scrapes--> api:3000/metrics
Grafana ----queries---> Prometheus
Pulse-Q services ----OTLP traces (when instrumentation is enabled)----> Jaeger
```

The repository uses **PostgreSQL**, not MongoDB, as its application database. The Compose stack therefore preserves PostgreSQL rather than introducing an unused MongoDB service. Workers currently expose liveness and activity through Redis heartbeats, while the API exposes the Prometheus endpoint; Prometheus consequently scrapes the API only.

## Start and stop

```bash
cp .env.example .env
# Change POSTGRES_PASSWORD and GRAFANA_ADMIN_PASSWORD in .env.
docker compose up --build
docker compose ps
docker compose logs -f api worker
```

Stop the environment with `docker compose down`. To remove persisted local data as well, use `docker compose down -v`. The normal `down` command preserves PostgreSQL, Redis, Prometheus, and Grafana volumes.

## Services and ports

| Service | Container endpoint | Host port by default | Purpose |
|---|---:|---:|---|
| Frontend | 8080 | 5173 | Web UI |
| API | 3000 | 3000 | Job API, health, metrics |
| PostgreSQL | 5432 | 5433 | Application persistence |
| Redis | 6379 | 6379 | Queue, locks, heartbeats |
| Prometheus | 9090 | 9090 | Metrics collection and queries |
| Grafana | 3000 | 3001 | Dashboards |
| Jaeger UI | 16686 | 16686 | Trace search and visualization |
| Jaeger OTLP | 4317/4318 | 4317/4318 | gRPC/HTTP trace ingestion |

The scheduler and worker have no host ports because they are internal processes. The worker healthcheck verifies connectivity to Redis; its detailed liveness is represented by the Redis heartbeat registry and API monitoring endpoints.

## Access

The API is available at `http://localhost:3000`, readiness is checked at `http://localhost:3000/ready`, and Prometheus metrics are exposed at `http://localhost:3000/metrics`. Prometheus is available at `http://localhost:9090`. Grafana is available at `http://localhost:3001` using the credentials configured in `.env`; the Pulse-Q datasource and dashboard are provisioned automatically. Jaeger is available at `http://localhost:16686`.

## Troubleshooting

If the API remains unhealthy, inspect `docker compose logs api` and confirm that PostgreSQL and Redis are healthy with `docker compose ps`; the API readiness endpoint requires both dependencies. If Grafana shows no data, check `docker compose logs prometheus grafana`, open Prometheus status targets, and verify that `api:3000` is up. If job activity is absent, inspect worker logs and query `/api/v1/metrics/workers`; the worker metrics depend on Redis heartbeat records. If ports are already occupied, override the corresponding `*_PORT` values in `.env`. If configuration or schema changes leave stale data, stop the stack with `docker compose down -v` and start it again; this deletes local development data.

## Tracing note

Jaeger is provisioned with OTLP gRPC and HTTP collectors. The current repository does not yet initialize OpenTelemetry SDK instrumentation, so Jaeger will remain empty until tracing instrumentation is added to the API, Redis calls, worker execution, and database client. The collector endpoints are ready for that incremental integration.
