-- Persist correlation metadata for asynchronous job traces.
ALTER TABLE "jobs"
  ADD COLUMN "requestId" TEXT,
  ADD COLUMN "traceparent" TEXT,
  ADD COLUMN "tracestate" TEXT;

CREATE INDEX "jobs_requestId_idx" ON "jobs"("requestId");
CREATE INDEX "jobs_traceparent_idx" ON "jobs"("traceparent");
