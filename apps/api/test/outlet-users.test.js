import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Outlet and Users Module API Tests', () => {
  let app;
  let adminToken;
  let billerToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    // Generate test JWT for admin with full permissions
    adminToken = app.jwt.sign({
      sub: 'admin_test_id',
      role: ROLES.ADMIN,
      outletId: 'outlet_test_123',
      permissions: Object.values(PERMISSIONS),
    });

    // Generate test JWT for biller without settings/user management permissions
    billerToken = app.jwt.sign({
      sub: 'biller_test_id',
      role: ROLES.BILLER,
      outletId: 'outlet_test_123',
      permissions: [PERMISSIONS.ORDER_CREATE, PERMISSIONS.BILL_VIEW],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('RBAC Route Guarding', () => {
    it('blocks unauthenticated requests to /v1/outlet/profile', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/outlet/profile',
      });
      expect(res.statusCode).toBe(401);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('blocks biller from creating tax groups (missing outlet.settings.manage)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/outlet/tax-groups',
        headers: {
          authorization: `Bearer ${billerToken}`,
        },
        payload: {
          name: 'GST 18%',
          rate: 18,
          isInclusive: true,
          cgstRate: 9,
          sgstRate: 9,
          igstRate: 18,
        },
      });
      expect(res.statusCode).toBe(403);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('FORBIDDEN');
    });

    it('blocks biller from creating users (missing user.create)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: {
          authorization: `Bearer ${billerToken}`,
        },
        payload: {
          name: 'New Waiter',
          phone: '9876543210',
          role: ROLES.CAPTAIN,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates tax group payload with Zod schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/outlet/tax-groups',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: '', // Invalid: min 1
          rate: 150, // Invalid: max 100
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.fieldErrors).toBeDefined();
    });

    it('validates user creation payload with Zod schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
        payload: {
          name: 'A', // Too short
          phone: '123', // Invalid Indian phone
          role: 'INVALID_ROLE',
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });
});
