import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Username, email or phone is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const pinLoginSchema = z.object({
  deviceId: z.string().min(1, 'Device identifier is required'),
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
});

export const managerOverrideSchema = z.object({
  managerPin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 digits'),
  action: z.string().min(1, 'Action description is required'),
  reason: z.string().min(3, 'Reason must be provided'),
  referenceId: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required').optional(),
});
