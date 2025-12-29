import { zValidator } from '@hono/zod-validator';
import { ExpenseStatus, UserRole } from '@prisma/client';
import { Hono } from 'hono';

import { createExpense, deleteExpense, getExpenses, updateExpense } from '@/features/expenses/queries';
import { createExpenseSchema, getExpensesQuerySchema, updateExpenseSchema } from '@/features/expenses/schema';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', getExpensesQuerySchema), async (ctx) => {
    const user = ctx.get('user');
    const params = ctx.req.valid('query');

    // Drivers can only see their own expenses
    let driverId = params.driverId;
    if (user.role === UserRole.DRIVER) {
      // Find driver profile
      const { db } = await import('@/lib/db');
      const driver = await db.driverProfile.findUnique({ where: { userId: user.id } });
      if (!driver) return ctx.json({ error: 'Driver profile not found' }, 404);

      // Force driverId filter
      driverId = driver.id;
    } else {
      const allowedRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR];
      if (!allowedRoles.includes(user.role)) {
        return ctx.json({ error: 'Unauthorized' }, 403);
      }
    }

    try {
      const result = await getExpenses({
        ...params,
        driverId,
        startDate: params.startDate ? new Date(params.startDate) : undefined,
        endDate: params.endDate ? new Date(params.endDate) : undefined,
        page: params.page ? parseInt(params.page) : 1,
        limit: params.limit ? parseInt(params.limit) : 20,
      });
      return ctx.json(result);
    } catch (error) {
      console.error(error);
      return ctx.json({ error: 'Failed to fetch expenses' }, 500);
    }
  })
  .post('/', sessionMiddleware, zValidator('json', createExpenseSchema), async (ctx) => {
    const user = ctx.get('user');
    const data = ctx.req.valid('json');

    // Status logic: Drivers -> PENDING, Admins -> APPROVED
    let status: ExpenseStatus = ExpenseStatus.PENDING;
    const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (adminRoles.includes(user.role)) {
      status = ExpenseStatus.APPROVED;
    }

    try {
      const expense = await createExpense({
        ...data,
        spentByUserId: user.id,
        status,
        approvedById: status === ExpenseStatus.APPROVED ? user.id : undefined,
      });
      return ctx.json({ data: expense });
    } catch (error) {
      console.error(error);
      return ctx.json({ error: 'Failed to create expense' }, 500);
    }
  })
  .patch('/:id', sessionMiddleware, zValidator('json', updateExpenseSchema), async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();
    const data = ctx.req.valid('json');

    // Only Admins can approve/reject or edit arbitrary expenses
    const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!adminRoles.includes(user.role)) {
      // Drivers might edit their own PENDING expenses? Let's restrict for simplicity first.
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      // If approving, set approvedById
      const updateData: any = { ...data };
      if (data.status === ExpenseStatus.APPROVED) {
        updateData.approvedById = user.id;
      }

      const expense = await updateExpense(id, updateData);
      return ctx.json({ data: expense });
    } catch (error) {
      return ctx.json({ error: 'Failed to update expense' }, 500);
    }
  })
  .delete('/:id', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    const adminRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
    if (!adminRoles.includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      await deleteExpense(id);
      return ctx.json({ success: true });
    } catch (error) {
      return ctx.json({ error: 'Failed to delete expense' }, 500);
    }
  });

export default app;
