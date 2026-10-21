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
  email: z.string().email('Valid email required').optional(),
  address: z.object({
    line1: z.string().min(1, 'Address line 1 is required'),
    line2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    stateCode: z.string().min(2).max(2), // Indian state code (e.g. 27 for Maharashtra)
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  }),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
  operatingHours: z
    .object({
      openTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      closeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
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
