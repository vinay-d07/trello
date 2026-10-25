import { Redis, type RedisOptions } from 'ioredis';
import { env, isTest } from '../config/env';
import { logger } from './logger';

const clients = new Set<Redis>();

/**
 * Every Redis connection goes through here so it gets error logging and is
 * closed on shutdown. Blocking consumers (BullMQ workers, pub/sub) need their
 * own connection — never share one with regular commands.
 */
export function createRedis(name: string, options: RedisOptions = {}): Redis {
  const client = new Redis(env.REDIS_URL, {
    connectionName: name,
    // Tests that never touch Redis shouldn't need a running server.
    lazyConnect: isTest,
    ...options,
  });
  client.on('error', (err) => logger.error({ err, redis: name }, 'redis error'));
  clients.add(client);
  return client;
}

export function trackRedis(client: Redis, name: string): Redis {
  client.on('error', (err) => logger.error({ err, redis: name }, 'redis error'));
  clients.add(client);
  return client;
}

export async function closeAllRedis(): Promise<void> {
  await Promise.allSettled([...clients].map((client) => client.quit()));
  clients.clear();
}

/** General-purpose client: caching, rate limiting, health checks. */
export const redis = createRedis('main');
