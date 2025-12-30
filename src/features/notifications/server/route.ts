
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { sessionMiddleware } from '@/lib/session-middleware';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '../queries';

const app = new Hono()
  .get(
    '/',
    sessionMiddleware,
    zValidator('query', z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
    })),
    async (ctx) => {
      const user = ctx.get('user');
      const { page, limit } = ctx.req.valid('query');

      try {
        const result = await getNotifications(user.id, page, limit);
        return ctx.json(result);
      } catch (error) {
        return ctx.json({ error: 'Failed to fetch notifications' }, 500);
      }
    }
  )
  .get(
    '/unread',
    sessionMiddleware,
    async (ctx) => {
      const user = ctx.get('user');
      try {
        const count = await getUnreadCount(user.id);
        return ctx.json({ count });
      } catch (error) {
        return ctx.json({ error: 'Failed to fetch unread count' }, 500);
      }
    }
  )
  .patch(
    '/:id/read',
    sessionMiddleware,
    async (ctx) => {
      const user = ctx.get('user');
      const { id } = ctx.req.param();

      try {
        await markNotificationAsRead(id, user.id);
        return ctx.json({ success: true });
      } catch (error) {
        return ctx.json({ error: 'Failed to mark as read' }, 500);
      }
    }
  )
  .patch(
    '/read-all',
    sessionMiddleware,
    async (ctx) => {
      const user = ctx.get('user');
      try {
        await markAllNotificationsAsRead(user.id);
        return ctx.json({ success: true });
      } catch (error) {
        return ctx.json({ error: 'Failed to mark all as read' }, 500);
      }
    }
  );

export default app;
