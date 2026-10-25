import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { closeAllRedis } from './lib/redis';
import { closeQueues } from './queues/notification.queue';
import { createSocketServer } from './realtime/socket-server';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const app = createApp();
const httpServer = createServer(app);
const io = createSocketServer(httpServer);

httpServer.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'API listening');
});

let shuttingDown = false;

/** Stop accepting work, drain in-flight requests, then release connections. */
async function shutdown(signal: string, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, 'shutting down');

  setTimeout(() => {
    logger.error('graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  try {
    await io.close(); // also closes the underlying HTTP server
    await closeQueues();
    await Promise.allSettled([prisma.$disconnect(), closeAllRedis()]);
  } catch (err) {
    logger.error({ err }, 'error during shutdown');
    exitCode = 1;
  }
  process.exit(exitCode);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => logger.error({ err: reason }, 'unhandled rejection'));
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaught exception');
  void shutdown('uncaughtException', 1);
});
