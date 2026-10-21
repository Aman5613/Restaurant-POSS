import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Sync Module API Tests (Offline Batch Outbox & Delta Pull)', () => {
  let app;
  let adminToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    adminToken = app.jwt.sign({
      sub: '507f1f77bcf86cd799439011',
      role: ROLES.ADMIN,
      outletId: '507f191e810c19729de860ea',
      permissions: Object.values(PERMISSIONS),
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Sync Security & Endpoint Guarding', () => {
    it('blocks unauthenticated access to /v1/sync/pull', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/sync/pull',
      });
      expect(res.statusCode).toBe(401);
    });

    it('blocks unauthenticated access to /v1/sync/push', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/sync/push',
        payload: { events: [] },
      });
      expect(res.statusCode).toBe(401);
    });

    it('handles authenticated batch push payload structure', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/sync/push',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          events: [
            {
              id: 'local_evt_1',
              type: 'UNKNOWN_TEST',
              payload: {},
            },
          ],
        },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data.processed).toBe(1);
      expect(body.data.results[0].status).toBe('SKIPPED_UNKNOWN_TYPE');
    });
  });
});
