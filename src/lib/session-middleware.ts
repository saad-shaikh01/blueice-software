import { UserRole } from '@prisma/client';
import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import 'server-only';

import { AUTH_COOKIE } from '@/features/auth/constants';
import { verifyToken } from './authenticate';


type AdditionalContext = {
  Variables: {
    userId: string;
    user: {
      id: string;
      email: string | null;
      name: string;
      role: UserRole;
    };

  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(async (ctx, next) => {
  const session = getCookie(ctx, AUTH_COOKIE);

  if (!session) {
    return ctx.json({ error: 'Unauthorized.' }, 401);
  }

  const user = await verifyToken(session);

  if (!user) {
    return ctx.json({ error: 'Invalid or expired session.' }, 401);
  }

  // Set user info in context
  ctx.set('userId', user.id);
  ctx.set('user', user);

  await next();
});

