import { OrderStatus } from '@prisma/client';

import { db } from '@/lib/db';

export async function getDriverStats(driverId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [totalOrders, completedOrders, pendingOrders, revenueData] = await Promise.all([
    db.order.count({ where: { driverId, scheduledDate: { gte: startOfDay, lte: endOfDay } } }),
    db.order.count({ where: { driverId, scheduledDate: { gte: startOfDay, lte: endOfDay }, status: OrderStatus.COMPLETED } }),
    db.order.count({ where: { driverId, scheduledDate: { gte: startOfDay, lte: endOfDay }, status: { not: OrderStatus.COMPLETED } } }),
    db.order.aggregate({
      where: { driverId, scheduledDate: { gte: startOfDay, lte: endOfDay }, status: OrderStatus.COMPLETED },
      _sum: { cashCollected: true },
    }),
  ]);

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    cashCollected: revenueData._sum.cashCollected?.toString() || '0',
  };
}
