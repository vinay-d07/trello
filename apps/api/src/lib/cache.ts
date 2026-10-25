import { logger } from './logger';
import { redis } from './redis';

export const cacheKeys = {
  userProjects: (userId: string) => `cache:user:${userId}:projects`,
};

/**
 * Cache-aside helper. Values must be JSON-serialisable (cache DTOs, not Prisma
 * rows — Dates come back as strings). Redis failures fall back to the loader so
 * the cache can never take the API down.
 */
export async function getOrSet<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get(key);
    if (hit !== null) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn({ err, key }, 'cache read failed');
  }

  const value = await loader();

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, 'cache write failed');
  }
  return value;
}

export async function invalidate(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn({ err, keys }, 'cache invalidation failed');
  }
}
