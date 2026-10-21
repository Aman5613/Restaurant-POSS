import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Reports & Audit Logs API Tests', () => {
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

  describe('Reports Endpoints Security', () => {
    it('rejects unauthenticated request to /v1/reports/sales', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/reports/sales',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated request to /v1/reports/item-wise', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/reports/item-wise',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated request to /v1/reports/day-end', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/reports/day-end',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Audit Logs Endpoints Security & Structure', () => {
    it('rejects unauthenticated request to /v1/audit-logs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/audit-logs',
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects unauthenticated POST to /v1/audit-logs', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/audit-logs',
        payload: {
          event: 'VOID_BILL',
        },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
