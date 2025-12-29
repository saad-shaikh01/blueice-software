import { ExpenseCategory, ExpensePaymentMethod, ExpenseStatus } from '@prisma/client';
import { z } from 'zod';

export const createExpenseSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.string().transform((val) => new Date(val)),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
  driverId: z.string().optional(),
  paymentMethod: z.nativeEnum(ExpensePaymentMethod).default(ExpensePaymentMethod.CASH_ON_HAND),
});

export const updateExpenseSchema = z.object({
  amount: z.coerce.number().min(0.01).optional(),
  date: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  description: z.string().optional(),
  receiptUrl: z.string().optional(),
  status: z.nativeEnum(ExpenseStatus).optional(),
});

export const getExpensesQuerySchema = z.object({
  driverId: z.string().optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  status: z.nativeEnum(ExpenseStatus).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
