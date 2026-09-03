import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
const retentionHours = Number(process.env.DEMO_RETENTION_HOURS ?? 24);
const batchSize = Number(process.env.DEMO_CLEANUP_BATCH_SIZE ?? 500);

const run = async () => {
  if (!Number.isFinite(retentionHours) || retentionHours <= 0) {
    throw new Error('DEMO_RETENTION_HOURS must be a positive number');
  }
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
  const tagged = await prisma.$queryRaw`
    SELECT "id"
    FROM "jobs"
    WHERE "createdAt" < ${cutoff}
      AND "payload" @> '{"__pulseqDemo": true}'::jsonb
    ORDER BY "createdAt" ASC
    LIMIT ${batchSize}
  `;
  const ids = tagged.map((row) => row.id).filter((id) => typeof id === 'string');
  if (ids.length === 0) {
    console.log('No expired demo jobs found.');
    return;
  }

  const transaction = redis.multi();
  for (const id of ids) {
    transaction.zrem('jobs:scheduled', id);
    transaction.hdel('jobs:priority', id);
    transaction.srem('jobs:dlq', id);
  }
  await transaction.exec();
  const deleted = await prisma.job.deleteMany({ where: { id: { in: ids } } });
  console.log(`Deleted ${deleted.count} expired demo jobs.`);
};

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await redis.quit();
    await prisma.$disconnect();
  });
