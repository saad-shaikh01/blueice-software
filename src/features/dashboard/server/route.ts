import { Hono } from 'hono';
import { db } from '@/lib/db';
import { sessionMiddleware } from '@/lib/session-middleware';
import { OrderStatus } from '@prisma/client';

const app = new Hono()
  .get('/', sessionMiddleware, async (ctx) => {
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const [
        customerCount,
        orderCount,
        activeOrderCount,
        revenueData,
        dailyRevenue,
        orderStatusDistribution
      ] = await Promise.all([
        db.customerProfile.count(),
        db.order.count(),
        db.order.count({
          where: {
            status: {
              notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED]
            }
          }
        }),
        db.order.aggregate({
          where: {
            status: OrderStatus.COMPLETED
          },
          _sum: {
            totalAmount: true
          }
        }),
        // Revenue per day (last 30 days)
        db.$queryRaw`
          SELECT DATE("createdAt") as date, SUM("totalAmount") as amount
          FROM "Order"
          WHERE "status" = 'COMPLETED'
          AND "createdAt" >= ${thirtyDaysAgo}
          GROUP BY DATE("createdAt")
          ORDER BY DATE("createdAt") ASC
        `,
        // Order Status Distribution
        db.order.groupBy({
          by: ['status'],
          _count: {
            id: true
          }
        })
      ]);

      return ctx.json({
        data: {
          customerCount,
          orderCount,
          activeOrderCount,
          totalRevenue: revenueData._sum.totalAmount?.toString() || '0',
          dailyRevenue: dailyRevenue as { date: Date; amount: number }[],
          orderStatusDistribution: orderStatusDistribution.map(item => ({
            name: item.status,
            value: item._count.id
          }))
        }
      });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch dashboard stats' }, 500);
    }
  });

export default app;
