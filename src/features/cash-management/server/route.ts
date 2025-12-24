import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { UserRole } from '@prisma/client';

import { sessionMiddleware } from '@/lib/session-middleware';
import {
  submitCashHandoverSchema,
  verifyCashHandoverSchema,
  getCashHandoversQuerySchema,
} from '@/features/cash-management/schema';
import {
  submitCashHandover,
  getCashHandovers,
  getCashHandover,
  verifyCashHandover,
  getCashDashboardStats,
  getDriverDaySummary,
  getDriverHandoverHistory,
  getCashCollectionTrends,
} from '@/features/cash-management/queries';
import { getDriverByUserId } from '@/features/drivers/queries';

const ADMIN = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

const app = new Hono()
  // ========== DRIVER ENDPOINTS ==========

  // Get driver's day summary (for submission form)
  .get('/driver/day-summary', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    if (user.role !== UserRole.DRIVER) {
      return ctx.json({ error: 'Only drivers can access this endpoint' }, 403);
    }

    try {
      const driver = await getDriverByUserId(user.id);
      if (!driver) return ctx.json({ error: 'Driver not found' }, 404);

      const date = new Date(); // Today
      const summary = await getDriverDaySummary(driver.id, date);

      return ctx.json({ data: summary });
    } catch (error) {
      console.error('[DRIVER_DAY_SUMMARY_ERROR]:', error);
      return ctx.json({ error: 'Failed to fetch day summary' }, 500);
    }
  })

  // Submit cash handover (Driver)
  .post(
    '/driver/submit',
    sessionMiddleware,
    zValidator('json', submitCashHandoverSchema),
    async (ctx) => {
      const user = ctx.get('user');

      if (user.role !== UserRole.DRIVER) {
        return ctx.json({ error: 'Only drivers can submit cash handovers' }, 403);
      }

      const data = ctx.req.valid('json');

      try {
        const driver = await getDriverByUserId(user.id);
        if (!driver) return ctx.json({ error: 'Driver not found' }, 404);

        const handover = await submitCashHandover({
          driverId: driver.id,
          date: new Date(data.date),
          actualCash: data.actualCash,
          driverNotes: data.driverNotes,
          shiftStart: data.shiftStart ? new Date(data.shiftStart) : undefined,
          shiftEnd: data.shiftEnd ? new Date(data.shiftEnd) : undefined,
        });

        return ctx.json({ data: handover, message: 'Cash handover submitted successfully' });
      } catch (error: any) {
        console.error('[SUBMIT_CASH_HANDOVER_ERROR]:', error);
        return ctx.json({ error: error.message || 'Failed to submit cash handover' }, 500);
      }
    }
  )

  // Get driver's handover history
  .get('/driver/history', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    if (user.role !== UserRole.DRIVER) {
      return ctx.json({ error: 'Only drivers can access this endpoint' }, 403);
    }

    try {
      const driver = await getDriverByUserId(user.id);
      if (!driver) return ctx.json({ error: 'Driver not found' }, 404);

      const history = await getDriverHandoverHistory(driver.id);
      return ctx.json({ data: history });
    } catch (error) {
      console.error('[DRIVER_HANDOVER_HISTORY_ERROR]:', error);
      return ctx.json({ error: 'Failed to fetch handover history' }, 500);
    }
  })

  // ========== ADMIN ENDPOINTS ==========

  // Get all cash handovers (Admin)
  .get(
    '/',
    sessionMiddleware,
    zValidator('query', getCashHandoversQuerySchema),
    async (ctx) => {
      const user = ctx.get('user');

      if (!ADMIN.includes(user.role)) {
        return ctx.json({ error: 'Unauthorized' }, 403);
      }

      const params = ctx.req.valid('query');

      try {
        const result = await getCashHandovers({
          ...params,
          startDate: params.startDate ? new Date(params.startDate) : undefined,
          endDate: params.endDate ? new Date(params.endDate) : undefined,
        });

        return ctx.json(result);
      } catch (error) {
        console.error('[GET_CASH_HANDOVERS_ERROR]:', error);
        return ctx.json({ error: 'Failed to fetch cash handovers' }, 500);
      }
    }
  )

  // Get dashboard statistics
  .get('/stats', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    if (!ADMIN.includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      const stats = await getCashDashboardStats();
      return ctx.json({ data: stats });
    } catch (error) {
      console.error('[GET_CASH_STATS_ERROR]:', error);
      return ctx.json({ error: 'Failed to fetch cash statistics' }, 500);
    }
  })

  // Get cash collection trends
  .get('/trends', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');

    if (!ADMIN.includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      const trends = await getCashCollectionTrends(30); // Last 30 days
      return ctx.json({ data: trends });
    } catch (error) {
      console.error('[GET_CASH_TRENDS_ERROR]:', error);
      return ctx.json({ error: 'Failed to fetch cash trends' }, 500);
    }
  })

  // Get single cash handover details
  .get('/:id', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    // Both admins and drivers can view handover details
    // Drivers can only view their own
    try {
      const handover = await getCashHandover(id);
      if (!handover) return ctx.json({ error: 'Cash handover not found' }, 404);

      // Check authorization
      if (user.role === UserRole.DRIVER) {
        const driver = await getDriverByUserId(user.id);
        if (!driver || driver.id !== handover.driverId) {
          return ctx.json({ error: 'Unauthorized' }, 403);
        }
      } else if (!ADMIN.includes(user.role)) {
        return ctx.json({ error: 'Unauthorized' }, 403);
      }

      return ctx.json({ data: handover });
    } catch (error) {
      console.error('[GET_CASH_HANDOVER_ERROR]:', error);
      return ctx.json({ error: 'Failed to fetch cash handover' }, 500);
    }
  })

  // Verify cash handover (Admin only)
  .patch(
    '/:id/verify',
    sessionMiddleware,
    zValidator('json', verifyCashHandoverSchema),
    async (ctx) => {
      const user = ctx.get('user');
      const { id } = ctx.req.param();

      if (!ADMIN.includes(user.role)) {
        return ctx.json({ error: 'Unauthorized' }, 403);
      }

      const data = ctx.req.valid('json');

      try {
        const handover = await verifyCashHandover({
          id,
          verifiedBy: user.id,
          ...data,
        });

        return ctx.json({
          data: handover,
          message: `Cash handover ${data.status.toLowerCase()} successfully`,
        });
      } catch (error: any) {
        console.error('[VERIFY_CASH_HANDOVER_ERROR]:', error);
        return ctx.json({ error: error.message || 'Failed to verify cash handover' }, 500);
      }
    }
  );

export default app;
