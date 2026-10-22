import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Phase 1-4 Architecture: Super-Admin & Cook Real-time API Tests', () => {
  let app;
  let superAdminToken;
  let adminToken;
  let cookToken;
  let billerToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    superAdminToken = app.jwt.sign({
      sub: 'super_admin_id',
      role: ROLES.SUPER_ADMIN,
      permissions: Object.values(PERMISSIONS),
    });

    adminToken = app.jwt.sign({
      sub: 'admin_owner_id',
      role: ROLES.ADMIN,
      outletId: 'outlet_test_123',
      permissions: Object.values(PERMISSIONS),
    });

    cookToken = app.jwt.sign({
      sub: 'cook_chef_id',
      role: ROLES.COOK,
      outletId: 'outlet_test_123',
      permissions: [
        PERMISSIONS.KOT_VIEW,
        PERMISSIONS.KOT_ACKNOWLEDGE,
        PERMISSIONS.KOT_READY,
        PERMISSIONS.MENU_VIEW,
      ],
    });

    billerToken = app.jwt.sign({
      sub: 'biller_id',
      role: ROLES.BILLER,
      outletId: 'outlet_test_123',
      permissions: [PERMISSIONS.ORDER_VIEW, PERMISSIONS.BILL_VIEW, PERMISSIONS.BILL_CREATE],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Super-Admin Route Authorization', () => {
    it('grants access to /v1/super-admin/stats for SUPER_ADMIN', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/super-admin/stats',
        headers: { authorization: `Bearer ${superAdminToken}` },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
    });

    it('blocks regular ADMIN from accessing /v1/super-admin/stats', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/super-admin/stats',
        headers: { authorization: `Bearer ${adminToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks BILLER from accessing /v1/super-admin/owners', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/super-admin/owners',
        headers: { authorization: `Bearer ${billerToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates restaurant owner provisioning payload schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/super-admin/owners',
        headers: { authorization: `Bearer ${superAdminToken}` },
        payload: {
          restaurantName: '', // Invalid empty
          ownerName: 'A',
          phone: '123', // Invalid phone
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Cook Role & KOT Workflow', () => {
    it('permits user creation with COOK role', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Chef Vikas',
          phone: '9444444444',
          role: ROLES.COOK,
          pin: '5555',
          password: 'Password@123',
        },
      });
      // In skipDb mode with dummy outlet, it passes RBAC and schema validation
      expect(res.statusCode).not.toBe(403);
      if (res.statusCode === 400) {
        const body = JSON.parse(res.payload);
        // Ensure error is not role rejection
        expect(body.message).not.toContain('Invalid enum value');
      }
    });

    it('blocks biller without KOT_ACKNOWLEDGE from acknowledging ticket', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/kot/64f89d98e4b0123456789abc/acknowledge',
        headers: { authorization: `Bearer ${billerToken}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('blocks biller without KOT_READY from marking ticket ready', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/kot/64f89d98e4b0123456789abc/ready',
        headers: { authorization: `Bearer ${billerToken}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Real-Time Socket Gateway Helpers', () => {
    it('registers Fastify socket emission decorators', () => {
      expect(app.io).toBeDefined();
    });
  });
});
