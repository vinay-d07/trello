import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

// Reuse one client across hot reloads in dev; each PrismaClient owns a connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.LOG_LEVEL === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
