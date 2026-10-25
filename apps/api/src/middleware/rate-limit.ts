import { rateLimit } from 'express-rate-limit';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { isTest } from '../config/env';
import { redis } from '../lib/redis';

interface RateLimitOptions {
  /** Namespaces the Redis keys so limiters don't share counters. */
  prefix: string;
  windowMs: number;
  limit: number;
}

/**
 * Redis-backed so limits hold across every API instance. In-memory stores
 * silently multiply the limit by the number of instances.
 */
export function createRateLimiter({ prefix, windowMs, limit }: RateLimitOptions) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' } },
    store: isTest
      ? undefined
      : new RedisStore({
          prefix: `rl:${prefix}:`,
          sendCommand: (command: string, ...args: string[]) =>
            redis.call(command, ...args) as Promise<RedisReply>,
        }),
  });
}
