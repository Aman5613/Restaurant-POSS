import { describe, it, expect } from 'vitest';
import { calculateBill } from '../src/billing/billing-engine.js';
import {
  formatPaiseToRupees,
  normalizePhoneNumber,
  validateGSTIN,
  amountInWords,
} from '../src/utils/formatters.js';

describe('Billing Engine (Paise calculations)', () => {
  it('calculates simple order with 5% inclusive GST', () => {
    // 2 Biryani @ 200 INR (20000 paise) = 40000 paise
    const result = calculateBill({
      items: [
        {
          itemId: 'item_1',
          name: 'Chicken Biryani',
          unitPrice: 20000,
          quantity: 2,
          taxRate: 5,
          isTaxInclusive: true,
        },
      ],
    });

    expect(result.subtotal).toBe(40000);
    expect(result.totalDiscount).toBe(0);
    // Taxable base for 40000 inclusive @ 5% = 40000 / 1.05 = 38095.238 -> 38095
    expect(result.lines[0].taxableAmount).toBe(38095);
    expect(result.lines[0].taxAmount).toBe(1905); // 40000 - 38095
    expect(result.taxes.cgst + result.taxes.sgst).toBe(1905);
    expect(result.payableAmount).toBe(40000);
  });

  it('calculates order with exclusive GST correctly', () => {
    // 1 item @ 100 INR (10000 paise) with 5% exclusive GST = 10500 paise
    const result = calculateBill({
      items: [
        {
          itemId: 'item_2',
          name: 'Paneer Tikka',
          unitPrice: 10000,
          quantity: 1,
          taxRate: 5,
          isTaxInclusive: false,
        },
      ],
    });

    expect(result.subtotal).toBe(10000);
    expect(result.lines[0].taxAmount).toBe(500);
    expect(result.taxes.cgst).toBe(250);
    expect(result.taxes.sgst).toBe(250);
    expect(result.payableAmount).toBe(10500);
  });

  it('applies item-level and bill-level discounts correctly', () => {
    // Item 1: 10000 paise with 10% item discount = 9000 paise
    // Bill discount: 10% flat on remainder
    const result = calculateBill({
      items: [
        {
          itemId: 'item_3',
          name: 'Burger',
          unitPrice: 10000,
          quantity: 1,
          taxRate: 0,
          discount: { type: 'PERCENT', value: 10 },
        },
      ],
      billDiscount: { type: 'PERCENT', value: 10 },
    });

    expect(result.subtotal).toBe(10000);
    expect(result.itemDiscountTotal).toBe(1000);
    expect(result.billDiscountTotal).toBe(900); // 10% of 9000
    expect(result.totalDiscount).toBe(1900);
    expect(result.payableAmount).toBe(8100);
  });

  it('calculates round-off properly to nearest rupee', () => {
    // 10034 paise raw total should round off to 10000 paise (-34 paise roundoff)
    const result = calculateBill({
      items: [
        {
          itemId: 'item_4',
          name: 'Custom item',
          unitPrice: 10034,
          quantity: 1,
          taxRate: 0,
        },
      ],
    });

    expect(result.rawTotal).toBe(10034);
    expect(result.roundOff).toBe(-34);
    expect(result.payableAmount).toBe(10000);
  });

  it('handles add-on pricing', () => {
    // Pizza 30000 paise + Extra Cheese 5000 paise = 35000 paise
    const result = calculateBill({
      items: [
        {
          itemId: 'pizza_1',
          name: 'Margherita',
          unitPrice: 30000,
          quantity: 1,
          taxRate: 0,
          addons: [{ addonId: 'add_1', name: 'Extra Cheese', price: 5000 }],
        },
      ],
    });

    expect(result.subtotal).toBe(35000);
    expect(result.payableAmount).toBe(35000);
  });
});

describe('Formatters and Utilities', () => {
  it('formats paise to INR currency format', () => {
    expect(formatPaiseToRupees(15050)).toBe('₹150.50');
    expect(formatPaiseToRupees(0)).toBe('₹0.00');
    expect(formatPaiseToRupees(50)).toBe('₹0.50');
  });

  it('normalizes Indian phone numbers', () => {
    expect(normalizePhoneNumber('+91 9876543210')).toBe('9876543210');
    expect(normalizePhoneNumber('09876543210')).toBe('9876543210');
    expect(normalizePhoneNumber('98765 43210')).toBe('9876543210');
  });

  it('validates GSTIN structure', () => {
    expect(validateGSTIN('27AAPFU0939F1ZV')).toBe(true);
    expect(validateGSTIN('INVALID123')).toBe(false);
  });

  it('converts amount to words in Indian numbering system', () => {
    expect(amountInWords(15000)).toBe('One Hundred Fifty Rupees Only');
    expect(amountInWords(250075)).toBe('Two Thousand Five Hundred Rupees and Seventy Five Paise Only');
    expect(amountInWords(10000000)).toBe('One Lakh Rupees Only');
    expect(amountInWords(0)).toBe('Zero Rupees Only');
  });
});
