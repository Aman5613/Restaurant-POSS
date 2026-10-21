import { z } from 'zod';

export const billDiscountSchema = z.object({
  type: z.enum(['PERCENT', 'FLAT']),
  value: z.number().nonnegative(),
  reason: z.string().min(2, 'Discount reason required'),
  managerOverrideToken: z.string().optional(),
});

export const paymentRecordSchema = z.object({
  mode: z.enum(['CASH', 'UPI', 'CARD', 'DUE', 'COMPLIMENTARY', 'WALLET']),
  amount: z.number().int().positive('Payment amount must be positive paise'),
  referenceNo: z.string().optional(),
  cashTendered: z.number().int().positive().optional(),
  changeReturned: z.number().int().nonnegative().optional(),
});

export const generateBillSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  discount: billDiscountSchema.optional(),
  charges: z
    .array(
      z.object({
        name: z.string(),
        rate: z.number(),
        isPercentage: z.boolean(),
        taxRate: z.number().optional(),
        isInclusive: z.boolean().optional(),
      })
    )
    .optional(),
  isInterState: z.boolean().default(false),
});

export const settleBillSchema = z.object({
  billId: z.string().min(1, 'Bill ID is required'),
  payments: z.array(paymentRecordSchema).min(1, 'At least one payment required'),
});

export const voidBillSchema = z.object({
  reason: z.string().min(3, 'Void reason required'),
  managerOverrideToken: z.string().min(1, 'Manager override token required'),
});

export const splitBillSchema = z.object({
  splitType: z.enum(['EQUAL', 'BY_ITEMS']),
  splitCount: z.number().int().min(2).max(10).optional(),
  subBills: z
    .array(
      z.object({
        lineIds: z.array(z.string()).min(1),
      })
    )
    .optional(),
});
