import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';

describe('Fastify Server Base Health & Error Handling', () => {
  let app;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('handles invalid login payload with validation error format', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {
        identifier: 'a', // Too short
        password: '123', // Too short
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.payload);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.fieldErrors).toBeDefined();
    expect(body.requestId).toBeDefined();
  });
});
