/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `jobs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "recurringDefinitionId" TEXT;

-- CreateTable
CREATE TABLE "recurring_jobs" (
    "id" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "nextRunAt" TIMESTAMPTZ(6) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recurring_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_jobs_active_nextRunAt_idx" ON "recurring_jobs"("active", "nextRunAt");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_idempotencyKey_key" ON "jobs"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_recurringDefinitionId_fkey" FOREIGN KEY ("recurringDefinitionId") REFERENCES "recurring_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
