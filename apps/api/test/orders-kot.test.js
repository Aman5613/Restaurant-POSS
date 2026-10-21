import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Orders & KOT Management API Tests', () => {
  let app;
  let adminToken;
  let captainToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    adminToken = app.jwt.sign({
      sub: 'admin_id_orders',
      role: ROLES.ADMIN,
      outletId: 'outlet_orders_123',
      permissions: Object.values(PERMISSIONS),
    });

    captainToken = app.jwt.sign({
      sub: 'captain_id_orders',
      role: ROLES.CAPTAIN,
      outletId: 'outlet_orders_123',
      permissions: [PERMISSIONS.ORDER_VIEW, PERMISSIONS.ORDER_CREATE, PERMISSIONS.KOT_VIEW],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Order Creation & Validation', () => {
    it('validates order payload with Zod schema', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/orders',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          outletId: 'outlet_orders_123',
          orderType: 'INVALID_TYPE',
          items: [],
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('requires item quantity to be positive', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/orders',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          outletId: 'outlet_orders_123',
          orderType: 'DINE_IN',
          items: [
            {
              itemId: 'item_1',
              name: 'Paneer Butter Masala',
              quantity: 0,
              unitPrice: 28000,
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Line cancellation & Permissions', () => {
    it('blocks captain without manager override from cancelling line after KOT', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/orders/64f89d98e4b0123456789abc/lines/64f89d98e4b0123456789def/cancel',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          reason: 'Customer changed mind',
        },
      });
      // Captain only has ORDER_VIEW, ORDER_CREATE, KOT_VIEW, lacks ORDER_CANCEL_AFTER_KOT
      expect(res.statusCode).toBe(403);
    });

    it('requires cancellation reason when admin cancels', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/orders/64f89d98e4b0123456789abc/lines/64f89d98e4b0123456789def/cancel',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          reason: 'x', // Too short (min 2 chars required)
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('KOT Reprint Endpoints', () => {
    it('blocks captain from reprinting KOT without kot.reprint permission', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/kot/64f89d98e4b0123456789abc/reprint',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          reason: 'Printer jammed',
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('requires reprint reason from admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/kot/64f89d98e4b0123456789abc/reprint',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          reason: '',
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
