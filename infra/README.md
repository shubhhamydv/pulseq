# Infrastructure

Local development infrastructure is defined in `docker-compose.yml` and includes only PostgreSQL and Redis. Start both services with:

```bash
docker compose -f infra/docker-compose.yml up -d
```

PostgreSQL persists data in `postgres_data`; Redis runs Redis 7 with append-only persistence in `redis_data`. Both services expose health checks and use `restart: unless-stopped`. The backend connects to Redis through `REDIS_URL` and reports PostgreSQL and Redis health independently at `GET /api/v1/health`.

The current phase intentionally does not include queues, workers, scheduling, job execution, retries, streams, pub/sub, or distributed locking.
