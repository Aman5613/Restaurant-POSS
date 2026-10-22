import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const itemVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant name required (e.g. Regular, Large)'),
  price: z.number().int().nonnegative('Price must be non-negative paise'),
  isAvailable: z.boolean().default(true),
});

export const addonOptionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Addon option name required'),
  price: z.number().int().nonnegative('Price must be non-negative paise'),
  isAvailable: z.boolean().default(true),
});

export const addonGroupSchema = z.object({
  name: z.string().min(1, 'Addon group name required (e.g. Extra Toppings)'),
  minSelect: z.number().int().nonnegative().default(0),
  maxSelect: z.number().int().positive().default(5),
  options: z.array(addonOptionSchema).default([]),
  isActive: z.boolean().default(true),
});

export const kitchenStationSchema = z.object({
  name: z.string().min(1, 'Station name required (e.g. Main Kitchen, Tandoor, Bar)'),
  printerId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const itemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Item name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().int().nonnegative('Base price must be in paise').default(0),
  taxGroupId: z.string().optional(),
  stationId: z.string().optional(),
  isVeg: z.boolean().default(true),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  variants: z.array(itemVariantSchema).default([]),
  addons: z.array(addonOptionSchema).default([]),
  addonGroupIds: z.array(z.string()).default([]),
});

export const updateItemAvailabilitySchema = z.object({
  isAvailable: z.boolean(),
});
