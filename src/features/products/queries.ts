import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function getProducts(search?: string) {
  const where: Prisma.ProductWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const products = await db.product.findMany({
    where,
    orderBy: {
      name: 'asc',
    },
  });

  return products;
}

export async function getProduct(id: string) {
  return await db.product.findUnique({
    where: { id },
  });
}

export async function createProduct(data: {
  name: string;
  sku: string;
  basePrice: number;
  isReturnable: boolean;
  stockFilled: number;
  stockEmpty: number;
}) {
  return await db.product.create({
    data: {
      ...data,
      basePrice: new Prisma.Decimal(data.basePrice),
    },
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    sku: string;
    basePrice: number;
    isReturnable: boolean;
    stockFilled: number;
    stockEmpty: number;
  }>
) {
  const { basePrice, ...rest } = data;

  return await db.product.update({
    where: { id },
    data: {
      ...rest,
      ...(basePrice !== undefined && { basePrice: new Prisma.Decimal(basePrice) }),
    },
  });
}

export async function deleteProduct(id: string) {
  return await db.product.delete({
    where: { id },
  });
}
