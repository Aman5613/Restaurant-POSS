import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Day Operations & Customers API Tests', () => {
  let app;
  let adminToken;
  let captainToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    adminToken = app.jwt.sign({
      sub: 'admin_id_day',
      role: ROLES.ADMIN,
      outletId: 'outlet_day_123',
      permissions: Object.values(PERMISSIONS),
    });

    captainToken = app.jwt.sign({
      sub: 'captain_id_day',
      role: ROLES.CAPTAIN,
      outletId: 'outlet_day_123',
      permissions: [PERMISSIONS.ORDER_VIEW, PERMISSIONS.CUSTOMER_VIEW],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Day Operations Permissions & Validation', () => {
    it('blocks captain from opening business day without day.open permission', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/day-ops/open',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          openingFloat: 500000,
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates closing day requires non-negative closing cash', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/day-ops/close',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          closingCashCounted: -100, // Invalid negative
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('validates cash movement requires positive amount and reason', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/day-ops/cash-movements',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          type: 'CASH_OUT',
          amount: 0, // Must be positive
          reason: '', // Empty
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Customer Management Validation', () => {
    it('validates customer creation requires 10-digit phone', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/customers',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          name: 'Rajesh Kumar',
          phone: '98765', // Invalid length
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('blocks captain from collecting due without customer.dues.collect permission', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/customers/64f89d98e4b0123456789abc/dues/collect',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          amount: 50000,
          paymentMode: 'CASH',
        },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
