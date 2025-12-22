import { Hono } from 'hono';
import { db } from '@/lib/db';
import { sessionMiddleware } from '@/lib/session-middleware';
import { OrderStatus } from '@prisma/client';

const app = new Hono()
  .get('/', sessionMiddleware, async (ctx) => {
    try {
      const [
        customerCount,
        orderCount,
        activeOrderCount,
        revenueData
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
        })
      ]);

      return ctx.json({
        data: {
          customerCount,
          orderCount,
          activeOrderCount,
          totalRevenue: revenueData._sum.totalAmount?.toString() || '0'
        }
      });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch dashboard stats' }, 500);
    }
  });

export default app;
