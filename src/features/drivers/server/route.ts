import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Prisma, UserRole } from '@prisma/client';

import { sessionMiddleware } from '@/lib/session-middleware';
import { createDriverSchema, getDriversQuerySchema, updateDriverSchema } from '@/features/drivers/schema';
import {
  createDriver,
  deleteDriver,
  getDriver,
  getDriverByUserId,
  getDrivers,
  updateDriver,
} from '@/features/drivers/queries';

const app = new Hono()
  .get('/me', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    try {
      const driver = await getDriverByUserId(user.id);
      if (!driver) return ctx.json({ error: 'Driver not found' }, 404);
      return ctx.json({ data: driver });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch driver' }, 500);
    }
  })
  .get('/', sessionMiddleware, zValidator('query', getDriversQuerySchema), async (ctx) => {
    const params = ctx.req.valid('query');

    try {
      const result = await getDrivers(params);
      return ctx.json(result);
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch drivers' }, 500);
    }
  })
  .get('/:id', sessionMiddleware, async (ctx) => {
    const { id } = ctx.req.param();

    try {
      const driver = await getDriver(id);
      if (!driver) return ctx.json({ error: 'Driver not found' }, 404);
      return ctx.json({ data: driver });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch driver' }, 500);
    }
  })
  .post('/', sessionMiddleware, zValidator('json', createDriverSchema), async (ctx) => {
    const user = ctx.get('user');

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const driver = await createDriver({
        ...data,
        email: data.email ?? null,
      });
      return ctx.json({ data: driver });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         const target = (error.meta?.target as string[]) || [];
         if (target.includes('phoneNumber')) return ctx.json({ error: 'Phone number already exists' }, 400);
         if (target.includes('email')) return ctx.json({ error: 'Email already exists' }, 400);
      }
      return ctx.json({ error: 'Failed to create driver' }, 500);
    }
  })
  .patch('/:id', sessionMiddleware, zValidator('json', updateDriverSchema), async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const driver = await updateDriver(id, data);
      return ctx.json({ data: driver });
    } catch (error) {
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
         const target = (error.meta?.target as string[]) || [];
         if (target.includes('phoneNumber')) return ctx.json({ error: 'Phone number already exists' }, 400);
         if (target.includes('email')) return ctx.json({ error: 'Email already exists' }, 400);
      }
      return ctx.json({ error: 'Failed to update driver' }, 500);
    }
  })
  .delete('/:id', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      await deleteDriver(id);
      return ctx.json({ success: true });
    } catch (error) {
       if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return ctx.json({ error: 'Cannot delete driver with existing assignments' }, 400);
      }
      return ctx.json({ error: 'Failed to delete driver' }, 500);
    }
  });

export default app;
