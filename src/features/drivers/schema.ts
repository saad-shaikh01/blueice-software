import { z } from 'zod';

export const createDriverSchema = z.object({
  // User Fields
  name: z.string().trim().min(1, 'Name is required'),
  phoneNumber: z.string().trim().min(10, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')).transform(val => val === '' ? null : val),
  password: z.string().min(8, 'Password must be at least 8 characters'),

  // Driver Profile Fields
  vehicleNo: z.string().trim().optional().nullable(),
  licenseNo: z.string().trim().optional().nullable(),
});

export const updateDriverSchema = z.object({
  name: z.string().trim().min(1).optional(),
  phoneNumber: z.string().trim().min(10).optional(),
  email: z.string().email().optional().nullable(),

  vehicleNo: z.string().trim().optional().nullable(),
  licenseNo: z.string().trim().optional().nullable(),
});

export const getDriversQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
