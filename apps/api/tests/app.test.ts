/**
 * HTTP-level tests that need neither Postgres nor Redis.
 * DB-backed integration tests: `npm run infra:up`, then `npm run db:test:prepare -w @taskflow/api`.
 */
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

describe('app', () => {
  it('reports liveness', async () => {
    const res = await request(app).get('/health/live');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('sets security headers and a request id', async () => {
    const res = await request(app).get('/health/live');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects unauthenticated requests to protected routes', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid bearer token', async () => {
    const res = await request(app).get('/api/projects').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('validates request bodies', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.fieldErrors).toHaveProperty('email');
  });

  it('handles malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(res.status).toBe(400);
  });
});
