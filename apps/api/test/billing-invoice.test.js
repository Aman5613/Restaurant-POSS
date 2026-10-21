import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS } from '@pos/shared';

describe('Billing & Invoice API Tests', () => {
  let app;
  let adminToken;
  let billerToken;
  let captainToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    adminToken = app.jwt.sign({
      sub: 'admin_id_bill',
      role: ROLES.ADMIN,
      outletId: 'outlet_bill_123',
      permissions: Object.values(PERMISSIONS),
    });

    billerToken = app.jwt.sign({
      sub: 'biller_id_bill',
      role: ROLES.BILLER,
      outletId: 'outlet_bill_123',
      permissions: [PERMISSIONS.BILL_VIEW, PERMISSIONS.BILL_GENERATE, PERMISSIONS.PAYMENT_COLLECT],
    });

    captainToken = app.jwt.sign({
      sub: 'captain_id_bill',
      role: ROLES.CAPTAIN,
      outletId: 'outlet_bill_123',
      permissions: [PERMISSIONS.ORDER_VIEW, PERMISSIONS.ORDER_CREATE],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Generate Bill Validation & Permissions', () => {
    it('blocks captain from generating bill without bill.generate permission', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing',
        headers: { authorization: `Bearer ${captainToken}` },
        payload: {
          orderId: '64f89d98e4b0123456789abc',
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('validates bill generation payload requires orderId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing',
        headers: { authorization: `Bearer ${billerToken}` },
        payload: {
          orderId: '', // Invalid empty string
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Discount Application & Validation', () => {
    it('validates discount requires a reason and non-negative value', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/64f89d98e4b0123456789abc/discounts',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          type: 'PERCENT',
          value: -5, // Negative
          reason: '', // Empty
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Bill Settlement Validation', () => {
    it('validates settlement requires at least one payment record', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/64f89d98e4b0123456789abc/settle',
        headers: { authorization: `Bearer ${billerToken}` },
        payload: {
          billId: '64f89d98e4b0123456789abc',
          payments: [], // Empty
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('requires positive payment amount in paise', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/64f89d98e4b0123456789abc/settle',
        headers: { authorization: `Bearer ${billerToken}` },
        payload: {
          billId: '64f89d98e4b0123456789abc',
          payments: [
            {
              mode: 'CASH',
              amount: 0, // Must be positive paise
            },
          ],
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Void Bill & Manager Override', () => {
    it('blocks biller from voiding a bill without bill.void permission', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/64f89d98e4b0123456789abc/void',
        headers: { authorization: `Bearer ${billerToken}` },
        payload: {
          reason: 'Customer walked out without paying',
          managerOverrideToken: 'mgr_token_123',
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('requires void reason and manager override token from admin', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/billing/64f89d98e4b0123456789abc/void',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          reason: '',
          managerOverrideToken: '',
        },
      });
      expect(res.statusCode).toBe(400);
    });
  });
});
