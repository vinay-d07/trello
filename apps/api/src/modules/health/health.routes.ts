import { Router } from 'express';
import { prisma } from '../../lib/prisma';
import { redis } from '../../lib/redis';

export const healthRouter = Router();

/** Liveness: the process is up. Never touches dependencies (a DB blip shouldn't restart pods). */
healthRouter.get('/live', (_req, res) => {
  res.json({ status: 'ok' });
});

/** Readiness: dependencies reachable; load balancers should stop routing here if not. */
healthRouter.get('/ready', async (_req, res) => {
  const [db, cache] = await Promise.allSettled([prisma.$queryRaw`SELECT 1`, redis.ping()]);
  const checks = { database: db.status === 'fulfilled', redis: cache.status === 'fulfilled' };
  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'degraded', checks });
});
