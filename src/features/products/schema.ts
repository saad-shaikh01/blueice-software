import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required'),
  sku: z.string().trim().min(1, 'SKU is required'),
  basePrice: z.coerce.number().min(0, 'Price must be positive'),
  isReturnable: z.boolean().default(true),
  stockFilled: z.coerce.number().int().min(0).default(0),
  stockEmpty: z.coerce.number().int().min(0).default(0),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).optional(),
  sku: z.string().trim().min(1).optional(),
  basePrice: z.coerce.number().min(0).optional(),
  isReturnable: z.boolean().optional(),
  stockFilled: z.coerce.number().int().min(0).optional(),
  stockEmpty: z.coerce.number().int().min(0).optional(),
});

export const getProductsQuerySchema = z.object({
  search: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
