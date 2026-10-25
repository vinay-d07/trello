import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/taskflow_test',
      REDIS_URL: 'redis://localhost:6379/1',
      JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-123',
    },
  },
});
