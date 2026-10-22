import { z } from 'zod';
import { validateGSTIN } from '../utils/formatters.js';

export const outletSchema = z.object({
  name: z.string().min(2, 'Outlet name must be at least 2 characters'),
  legalName: z.string().optional(),
  gstin: z
    .string()
    .refine((val) => !val || validateGSTIN(val), { message: 'Invalid GSTIN format' })
    .optional(),
  fssaiNumber: z.string().regex(/^\d{14}$/, 'FSSAI must be 14 digits').optional(),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    stateCode: z.string().min(2).max(2).default('27'), // Indian state code (e.g. 27 for Maharashtra)
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
  logoUrl: z.string().optional(),
  upiId: z.string().optional().or(z.literal('')),
  isSetupCompleted: z.boolean().default(false),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  operatingHours: z
    .object({
      openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    })
    .optional(),
});

export const updateOutletSchema = outletSchema.partial().extend({
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      stateCode: z.string().min(2).max(2).default('27').optional().or(z.literal('')),
      pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
    })
    .optional(),
});

export const taxGroupSchema = z.object({
  name: z.string().min(1, 'Tax group name is required'),
  rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
  isInclusive: z.boolean().default(true),
  cgstRate: z.number().min(0).max(50),
  sgstRate: z.number().min(0).max(50),
  igstRate: z.number().min(0).max(100),
  isActive: z.boolean().default(true),
});

export const chargeConfigSchema = z.object({
  name: z.string().min(1, 'Charge name is required'),
  type: z.enum(['SERVICE', 'PACKAGING', 'DELIVERY', 'CUSTOM']),
  rate: z.number().nonnegative('Rate must be non-negative'),
  isPercentage: z.boolean().default(true),
  taxGroupId: z.string().optional(),
  isInclusive: z.boolean().default(false),
  isActive: z.boolean().default(true),
  applicableOrderTypes: z
    .array(z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'ROOM_SERVICE']))
    .default(['DINE_IN', 'TAKEAWAY', 'DELIVERY']),
});

export const numberingSeriesSchema = z.object({
  docType: z.enum(['ORDER', 'BILL', 'KOT']),
  prefix: z.string().min(1).max(10),
  suffix: z.string().max(10).optional(),
  currentNumber: z.number().int().nonnegative().default(0),
  padding: z.number().int().min(2).max(8).default(4),
  resetFrequency: z.enum(['NEVER', 'DAILY', 'MONTHLY', 'FINANCIAL_YEAR']).default('DAILY'),
});

export const printerSchema = z.object({
  name: z.string().min(1, 'Printer name is required'),
  connectionType: z.enum(['NETWORK', 'USB', 'BLUETOOTH', 'SYSTEM_DIALOG']),
  ipAddress: z.string().optional(),
  port: z.number().int().default(9100).optional(),
  paperWidth: z.enum(['58mm', '80mm']).default('80mm'),
  isReceiptPrinter: z.boolean().default(false),
  isKotPrinter: z.boolean().default(false),
  stationIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const deviceSchema = z.object({
  deviceCode: z.string().min(2, 'Device code required'),
  name: z.string().min(2, 'Device name required'),
  deviceType: z.enum(['COUNTER_POS', 'CAPTAIN_HANDHELD', 'KITCHEN_DISPLAY']),
  isActive: z.boolean().default(true),
});

export const paymentModeSchema = z.object({
  name: z.string().min(1, 'Payment mode name required'),
  code: z.enum(['CASH', 'UPI', 'CARD', 'WALLET', 'DUE', 'COMPLIMENTARY']),
  isEnabled: z.boolean().default(true),
  opensCashDrawer: z.boolean().default(false),
  sortOrder: z.number().default(0),
});
