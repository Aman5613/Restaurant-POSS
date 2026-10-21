import { z } from 'zod';
import { ORDER_TYPES } from '../order-types.js';

export const orderLineSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().int().nonnegative('Unit price must be non-negative paise'),
  variantId: z.string().optional(),
  addons: z
    .array(
      z.object({
        addonId: z.string().min(1),
        name: z.string().min(1),
        price: z.number().int().nonnegative('Addon price must be non-negative paise'),
      })
    )
    .default([]),
  notes: z.string().max(200).optional(),
  taxRate: z.number().min(0).default(5),
  isTaxInclusive: z.boolean().default(true),
  isDiscountable: z.boolean().default(true),
  discount: z
    .object({
      type: z.enum(['PERCENT', 'FLAT']),
      value: z.number().nonnegative(),
      reason: z.string().optional(),
    })
    .optional(),
});

export const createOrderSchema = z.object({
  outletId: z.string().min(1, 'Outlet ID is required'),
  tableId: z.string().optional(),
  orderType: z.enum([
    ORDER_TYPES.DINE_IN,
    ORDER_TYPES.TAKEAWAY,
    ORDER_TYPES.DELIVERY,
    ORDER_TYPES.ROOM_SERVICE,
  ]),
  guestCount: z.number().int().positive().default(1),
  items: z.array(orderLineSchema).min(1, 'Order must contain at least one item'),
  customer: z
    .object({
      id: z.string().optional(),
      name: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().min(3, 'Cancellation reason required'),
  managerOverrideToken: z.string().optional(),
});

export const addOrderLinesSchema = z.object({
  items: z.array(orderLineSchema).min(1, 'At least one item required'),
});

export const updateOrderLineSchema = z.object({
  quantity: z.number().int().positive().optional(),
  notes: z.string().max(200).optional(),
});

export const cancelOrderLineSchema = z.object({
  reason: z.string().min(2, 'Cancellation reason required'),
  managerOverrideToken: z.string().optional(),
});

export const reprintKotSchema = z.object({
  reason: z.string().min(2, 'Reprint reason required'),
});
