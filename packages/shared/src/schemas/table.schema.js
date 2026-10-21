import { z } from 'zod';
import { TABLE_STATUS } from '../statuses.js';

export const areaSchema = z.object({
  name: z.string().min(1, 'Area name required (e.g. Ground Floor, AC Hall, Rooftop)'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const diningTableSchema = z.object({
  areaId: z.string().min(1, 'Area ID is required'),
  tableNumber: z.string().min(1, 'Table number or label required (e.g. T1, T2)'),
  capacity: z.number().int().positive('Capacity must be at least 1').default(4),
  status: z
    .enum([
      TABLE_STATUS.VACANT,
      TABLE_STATUS.OCCUPIED,
      TABLE_STATUS.BILLED,
      TABLE_STATUS.RESERVED,
      TABLE_STATUS.BLOCKED,
    ])
    .default(TABLE_STATUS.VACANT),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const updateTableStatusSchema = z.object({
  status: z.enum([
    TABLE_STATUS.VACANT,
    TABLE_STATUS.OCCUPIED,
    TABLE_STATUS.BILLED,
    TABLE_STATUS.RESERVED,
    TABLE_STATUS.BLOCKED,
  ]),
  guestCount: z.number().int().positive().optional(),
  currentOrderId: z.string().optional(),
});

export const transferTableSchema = z.object({
  sourceTableId: z.string().min(1, 'Source table required'),
  targetTableId: z.string().min(1, 'Target table required'),
  reason: z.string().optional(),
});

export const mergeTablesSchema = z.object({
  primaryTableId: z.string().min(1, 'Primary table required'),
  secondaryTableIds: z.array(z.string()).min(1, 'At least one table to merge required'),
  reason: z.string().optional(),
});
