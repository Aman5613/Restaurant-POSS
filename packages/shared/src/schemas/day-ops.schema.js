import { z } from 'zod';

export const openDaySchema = z.object({
  openingFloat: z.number().int().nonnegative().default(0),
  notes: z.string().max(200).optional(),
});

export const closeDaySchema = z.object({
  closingCashCounted: z.number().int().nonnegative(),
  notes: z.string().max(300).optional(),
  forceClose: z.boolean().default(false),
});

export const openShiftSchema = z.object({
  openingCash: z.number().int().nonnegative().default(0),
  deviceId: z.string().optional(),
});

export const closeShiftSchema = z.object({
  closingCash: z.number().int().nonnegative(),
  notes: z.string().max(200).optional(),
});

export const cashMovementSchema = z.object({
  type: z.enum(['CASH_IN', 'CASH_OUT', 'CASH_DROP']),
  amount: z.number().int().positive('Amount must be positive paise'),
  reason: z.string().min(2, 'Reason is required'),
  category: z.string().optional(),
});
