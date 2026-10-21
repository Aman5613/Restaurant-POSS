import { z } from 'zod';
import { ROLES } from '../roles.js';

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a valid 10-digit number'),
  role: z.enum([
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.BILLER,
    ROLES.CAPTAIN,
  ]),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits').optional(),
  outletId: z.string().optional(),
  customPermissions: z.array(z.string()).default([]),
  maxDiscountPercent: z.number().min(0).max(100).default(0),
  isActive: z.boolean().default(true),
});

export const userUpdateSchema = userCreateSchema.partial();

export const roleUpdateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});
