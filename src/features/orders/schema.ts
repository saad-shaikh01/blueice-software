import { z } from 'zod';
import { OrderStatus, PaymentMethod } from '@prisma/client';

export const createOrderSchema = z.object({
  customerId: z.string().uuid('Invalid customer'),
  driverId: z.string().uuid().optional().nullable(),
  scheduledDate: z.coerce.date(),
  status: z.nativeEnum(OrderStatus).default(OrderStatus.SCHEDULED),
  deliveryCharge: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),

  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
    price: z.coerce.number().min(0).optional(), // Optional, fetch from product if missing
  })).min(1, 'At least one item is required'),
});

export const updateOrderSchema = z.object({
  customerId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional().nullable(),
  scheduledDate: z.coerce.date().optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  deliveryCharge: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).optional(),
  deliveredAt: z.coerce.date().optional().nullable(),
  cashCollected: z.coerce.number().min(0).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),

  items: z.array(z.object({
    id: z.string().optional(),
    productId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
    price: z.coerce.number().min(0).optional(),
    filledGiven: z.coerce.number().int().min(0).optional(),
    emptyTaken: z.coerce.number().int().min(0).optional(),
  })).optional(),
});

export const bulkAssignSchema = z.object({
  orderIds: z.array(z.string().uuid()),
  driverId: z.string().uuid(),
});

export const generateOrdersSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  routeId: z.string().uuid().optional(),
});

export const getOrdersQuerySchema = z.object({
  search: z.string().optional(), // Search by customer name or order ID
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: z.string().uuid().optional(),
  driverId: z.string().optional(), // Allow 'unassigned' or UUID
  date: z.string().optional(), // Filter by specific date
  from: z.string().optional(),
  to: z.string().optional(),
  routeId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type BulkAssignInput = z.infer<typeof bulkAssignSchema>;
export type GenerateOrdersInput = z.infer<typeof generateOrdersSchema>;
