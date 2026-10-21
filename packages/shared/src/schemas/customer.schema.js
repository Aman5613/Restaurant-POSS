import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be a valid 10-digit number'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  gstin: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().max(300).optional(),
});

export const collectDueSchema = z.object({
  amount: z.number().int().positive('Collection amount must be positive paise'),
  paymentMode: z.enum(['CASH', 'UPI', 'CARD']),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});
