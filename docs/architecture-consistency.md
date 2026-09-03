# Distributed Scheduler Consistency Model

## Scope

The scheduler combines PostgreSQL as the durable source of job state with Redis as the scheduling and coordination layer. The worker uses a Redis ownership lock, an atomic PostgreSQL claim, a processing lease, execution logs, retries, a dead-letter queue, and PostgreSQL idempotency keys.

## Execution semantics

**At-most-once** would avoid duplicate attempts but could lose work. **At-least-once** allows recovery after crashes but may perform an attempt more than once. **Exactly-once** would require one indivisible outcome across the handler side effect, PostgreSQL, Redis, and failures between them; that guarantee is not provided here. The practical target is **effectively-once business behavior**: attempts remain at-least-once, while handlers use stable idempotency keys and durable deduplication to make externally observable effects behave once.

## Main failure windows

A worker claims a job in PostgreSQL after acquiring a Redis lock. If it crashes before completion, the lock eventually expires and the processing lease becomes stale; a recovery process can return the job to `PENDING` and schedule another attempt. If the original worker resumes after lock expiration, a duplicate attempt is possible. A lease must therefore exceed expected execution time, and handlers must be idempotent.

Redis failure can hide scheduled queue entries or prevent lock operations. PostgreSQL remains the durable job record, but queue reconciliation is required to reconstruct missing Redis membership. PostgreSQL failure prevents durable claims, completion, retries, DLQ updates, and idempotency decisions. A network partition can make one component observe stale state and can widen the duplicate-attempt window. Process restart is safe for persisted job and recurring-definition state, but in-flight transient Redis work is recovered only through leases, locks, and subsequent reconciliation.

## Recurring and priority scheduling

Recurring definitions are separate from execution jobs. A scheduler replica acquires a per-definition lock, atomically advances `nextRunAt`, creates one ordinary job, and enqueues it. The database conditional update prevents two replicas from generating the same occurrence. Due-time eligibility is stored as the Sorted Set score; priority is a separate Redis index used only after due candidates are selected. Thus, priority cannot bypass scheduled time or retry backoff.

## Idempotency boundary

The `Idempotency-Key` header is stored under a PostgreSQL unique constraint. Fast lookup improves normal latency, while a unique-constraint race handler returns the committed job from the competing request. This prevents duplicate logical job records for repeated client submissions. It does not make arbitrary external handler effects exactly once; each external effect needs its own idempotency strategy.

## Tradeoffs

Redis provides fast scheduling and coordination but is not treated as the sole durable source of truth. PostgreSQL provides durable state and uniqueness but does not atomically commit Redis membership. The system favors recoverability and at-least-once attempts over silent loss, with explicit documentation of duplicate-effect risks and a design path toward effectively-once business operations.
