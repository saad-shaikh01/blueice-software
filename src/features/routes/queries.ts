import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function createRoute(data: { name: string; description?: string | null }) {
  return await db.route.create({
    data,
  });
}

export async function getRoutes(params: {
  search?: string;
  page: number;
  limit: number;
}) {
  const { search, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.RouteWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [routes, total] = await Promise.all([
    db.route.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        name: 'asc',
      },
      include: {
        _count: {
          select: { customers: true },
        },
      },
    }),
    db.route.count({ where }),
  ]);

  return {
    routes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getRoute(id: string) {
  return await db.route.findUnique({
    where: { id },
  });
}

export async function updateRoute(
  id: string,
  data: Partial<{ name: string; description: string | null }>
) {
  return await db.route.update({
    where: { id },
    data,
  });
}

export async function deleteRoute(id: string) {
  return await db.route.delete({
    where: { id },
  });
}
