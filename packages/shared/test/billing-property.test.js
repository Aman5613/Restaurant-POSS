import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateBill } from '../src/billing/billing-engine.js';

describe('Billing Engine Property-Based Tests (fast-check: 1000+ random orders)', () => {
  it('preserves integer paise invariant and non-negative payable across 1000 orders', () => {
    const itemArbitrary = fc.record({
      itemId: fc.uuid(),
      name: fc.string({ minLength: 1, maxLength: 20 }),
      unitPrice: fc.integer({ min: 100, max: 200000 }), // ₹1 to ₹2000 in paise
      quantity: fc.integer({ min: 1, max: 20 }),
      taxRate: fc.constantFrom(0, 5, 12, 18, 28),
      isTaxInclusive: fc.boolean(),
      discountPercent: fc.integer({ min: 0, max: 50 }),
    });

    const billArbitrary = fc.record({
      items: fc.array(itemArbitrary, { minLength: 1, maxLength: 15 }),
      billDiscount: fc.option(
        fc.record({
          type: fc.constantFrom('PERCENT', 'FLAT'),
          value: fc.integer({ min: 1, max: 30 }),
        }),
        { nil: null }
      ),
      charges: fc.option(
        fc.array(
          fc.record({
            name: fc.constantFrom('Packaging', 'Delivery', 'Service Charge'),
            amount: fc.integer({ min: 500, max: 5000 }), // ₹5 to ₹50
          }),
          { maxLength: 3 }
        ),
        { nil: [] }
      ),
    });

    fc.assert(
      fc.property(billArbitrary, (billInput) => {
        const result = calculateBill(billInput);

        // Invariant 1: All financial values must be strict integers
        expect(Number.isInteger(result.subtotal)).toBe(true);
        expect(Number.isInteger(result.totalDiscount)).toBe(true);
        expect(Number.isInteger(result.taxes.cgst)).toBe(true);
        expect(Number.isInteger(result.taxes.sgst)).toBe(true);
        expect(Number.isInteger(result.payableAmount)).toBe(true);

        // Invariant 2: Payable amount must never be negative
        expect(result.payableAmount).toBeGreaterThanOrEqual(0);

        // Invariant 3: Subtotal matches sum of line gross amounts
        const calculatedGross = billInput.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );
        expect(result.subtotal).toBe(calculatedGross);

        // Invariant 4: Determinism (re-calculating yields identical result)
        const reResult = calculateBill(billInput);
        expect(result.payableAmount).toBe(reResult.payableAmount);
        expect(result.subtotal).toBe(reResult.subtotal);
        expect(result.taxes.cgst).toBe(reResult.taxes.cgst);
      }),
      { numRuns: 1000 }
    );
  });
});
