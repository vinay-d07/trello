/**
 * Background worker process. Runs separately from the API so slow jobs never
 * compete with request handling and both can be scaled independently.
 * Register new workers in the `workers` array.
 */
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeAllRedis } from './lib/redis';
import { createNotificationWorker } from './workers/notification.worker';

const SHUTDOWN_TIMEOUT_MS = 30_000;

const workers = [createNotificationWorker()];

logger.info({ workers: workers.map((w) => w.name) }, 'workers started');

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'stopping workers');

  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

  // close() waits for active jobs to finish before resolving.
  await Promise.allSettled(workers.map((worker) => worker.close()));
  await Promise.allSettled([prisma.$disconnect(), closeAllRedis()]);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ err: reason }, 'unhandled rejection'));
