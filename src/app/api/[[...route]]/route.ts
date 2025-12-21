import { Hono } from 'hono';
import { handle } from 'hono/vercel';

import auth from '@/features/auth/server/route';
import customers from '@/features/customers/server/route';

export const runtime = 'nodejs';

const app = new Hono().basePath('/api');


app.get('/hello', (c) => {
  return c.json({
    message: 'Hello Next.js!',
  })
})

// app.use('*', cook()); // Enable cookie parsing for all routes

const routes = app
  .route('/auth', auth)
  .route('/customers', customers)

export type AppType = typeof routes;

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
