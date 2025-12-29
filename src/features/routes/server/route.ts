import { zValidator } from '@hono/zod-validator';
import { Prisma, UserRole } from '@prisma/client';
import { Hono } from 'hono';

import { createRoute, deleteRoute, getRoute, getRoutes, updateRoute } from '@/features/routes/queries';
import { createRouteSchema, getRoutesQuerySchema, updateRouteSchema } from '@/features/routes/schema';
import { sessionMiddleware } from '@/lib/session-middleware';

const app = new Hono()
  .get('/', sessionMiddleware, zValidator('query', getRoutesQuerySchema), async (ctx) => {
    const params = ctx.req.valid('query');

    try {
      const result = await getRoutes(params);
      return ctx.json(result);
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch routes' }, 500);
    }
  })
  .get('/:id', sessionMiddleware, async (ctx) => {
    const { id } = ctx.req.param();

    try {
      const route = await getRoute(id);
      if (!route) return ctx.json({ error: 'Route not found' }, 404);
      return ctx.json({ data: route });
    } catch (error) {
      return ctx.json({ error: 'Failed to fetch route' }, 500);
    }
  })
  .post('/', sessionMiddleware, zValidator('json', createRouteSchema), async (ctx) => {
    const user = ctx.get('user');

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const route = await createRoute(data);
      return ctx.json({ data: route });
    } catch (error) {
      return ctx.json({ error: 'Failed to create route' }, 500);
    }
  })
  .patch('/:id', sessionMiddleware, zValidator('json', updateRouteSchema), async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    const data = ctx.req.valid('json');

    try {
      const route = await updateRoute(id, data);
      return ctx.json({ data: route });
    } catch (error) {
      return ctx.json({ error: 'Failed to update route' }, 500);
    }
  })
  .delete('/:id', sessionMiddleware, async (ctx) => {
    const user = ctx.get('user');
    const { id } = ctx.req.param();

    if (!([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MGR] as UserRole[]).includes(user.role)) {
      return ctx.json({ error: 'Unauthorized' }, 403);
    }

    try {
      await deleteRoute(id);
      return ctx.json({ success: true });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return ctx.json({ error: 'Cannot delete route with assigned customers' }, 400);
      }
      return ctx.json({ error: 'Failed to delete route' }, 500);
    }
  });

export default app;
