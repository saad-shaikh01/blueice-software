import { z } from 'zod';
import { CashHandoverStatus } from '@prisma/client';

export const submitCashHandoverSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  actualCash: z.number().min(0),
  driverNotes: z.string().optional(),
  shiftStart: z.string().optional(), // ISO timestamp
  shiftEnd: z.string().optional(), // ISO timestamp
});

export const verifyCashHandoverSchema = z.object({
  status: z.enum([
    CashHandoverStatus.VERIFIED,
    CashHandoverStatus.REJECTED,
    CashHandoverStatus.ADJUSTED,
  ]),
  adminNotes: z.string().optional(),
  adjustmentAmount: z.number().optional(),
});

export const getCashHandoversQuerySchema = z.object({
  status: z.nativeEnum(CashHandoverStatus).optional(),
  driverId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
