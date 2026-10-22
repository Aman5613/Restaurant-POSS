import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/app.js';
import { ROLES, PERMISSIONS, calculateBill, formatPaiseToRupees } from '@pos/shared';

describe('Full Day Operations & Order-to-Invoice E2E Lifecycle Contract Test', () => {
  let app;
  let adminToken;
  let billerToken;

  beforeAll(async () => {
    app = await buildApp({ skipDb: true });
    await app.ready();

    adminToken = app.jwt.sign({
      sub: '507f1f77bcf86cd799439011',
      role: ROLES.ADMIN,
      outletId: '507f191e810c19729de860ea',
      permissions: Object.values(PERMISSIONS),
    });

    billerToken = app.jwt.sign({
      sub: '507f1f77bcf86cd799439022',
      role: ROLES.BILLER,
      outletId: '507f191e810c19729de860ea',
      permissions: [
        PERMISSIONS.ORDER_CREATE,
        PERMISSIONS.ORDER_VIEW,
        PERMISSIONS.BILL_GENERATE,
        PERMISSIONS.BILL_VIEW,
        PERMISSIONS.PAYMENT_COLLECT,
        PERMISSIONS.KOT_VIEW,
      ],
    });
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('Lifecycle State Machine Invariants', () => {
    it('verifies calculations for complete dine-in meal with flat discount and exclusive GST', () => {
      // 2x Butter Chicken @ ₹320 (32000 paise) = 64000
      // 4x Butter Naan @ ₹40 (4000 paise) = 16000
      // Gross: 80000 paise (₹800)
      // Flat Discount: ₹50 (5000 paise) -> Subtotal after discount: 75000
      // 5% GST on 75000 = 3750 paise (CGST: 1875, SGST: 1875)
      // Grand Total: 78750 paise (₹787.50) -> Round off: +50 -> 78800 (₹788.00)
      const calculation = calculateBill({
        items: [
          {
            itemId: 'item_butter_chicken',
            name: 'Butter Chicken',
            unitPrice: 32000,
            quantity: 2,
            taxRate: 5,
            isTaxInclusive: false,
          },
          {
            itemId: 'item_naan',
            name: 'Butter Naan',
            unitPrice: 4000,
            quantity: 4,
            taxRate: 5,
            isTaxInclusive: false,
          },
        ],
        billDiscount: { type: 'FLAT', value: 5000 },
      });

      expect(calculation.subtotal).toBe(80000);
      expect(calculation.totalDiscount).toBe(5000);
      expect(calculation.taxes.cgst + calculation.taxes.sgst).toBe(3750);
      expect(calculation.payableAmount).toBe(78800); // 78750 rounded to nearest rupee = 78800
      expect(formatPaiseToRupees(calculation.payableAmount)).toBe('₹788.00');
    });

    it('enforces RBAC permissions across the order-to-invoice chain', async () => {
      // Biller can create orders
      const orderRes = await app.inject({
        method: 'POST',
        url: '/v1/orders',
        headers: { authorization: `Bearer ${billerToken}` },
        payload: {
          client_uuid: '550e8400-e29b-41d4-a716-446655440000',
          order_type: 'TAKEAWAY',
        },
      });
      // Route is permitted (does not return 401 or 403)
      expect(orderRes.statusCode).not.toBe(401);
      expect(orderRes.statusCode).not.toBe(403);

      // Biller cannot void settled bills without manager approval
      const voidRes = await app.inject({
        method: 'POST',
        url: '/v1/billing/507f1f77bcf86cd799439099/void',
        headers: { authorization: `Bearer ${billerToken}` },
        payload: {
          reason: 'Customer cancelled after preparing',
        },
      });
      expect(voidRes.statusCode).toBe(403); // Biller lacks BILL_VOID permission
    });

    it('validates manager override schema when voiding a bill', async () => {
      const voidRes = await app.inject({
        method: 'POST',
        url: '/v1/billing/507f1f77bcf86cd799439099/void',
        headers: { authorization: `Bearer ${adminToken}` },
        payload: {
          reason: 'Manager approved customer order cancel',
          managerOverrideToken: '', // Missing token triggers 400 validation error
        },
      });
      expect(voidRes.statusCode).toBe(400);
      const body = JSON.parse(voidRes.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });
  });
});
