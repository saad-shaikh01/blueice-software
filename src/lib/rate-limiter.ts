import { rateLimiter } from 'hono-rate-limiter';

// Strict rate limiter for authentication endpoints (login, register, password reset)
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Max 5 requests per window
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    // Use IP address as the key
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown';
    return ip;
  },
  handler: (c) => {
    return c.json(
      {
        error: 'Too many requests. Please try again later.',
      },
      429,
    );
  },
});

// Moderate rate limiter for general API endpoints
export const apiRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 100, // Max 100 requests per minute
  standardHeaders: 'draft-6',
  keyGenerator: (c) => {
    const forwarded = c.req.header('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : c.req.header('x-real-ip') || 'unknown';
    return ip;
  },
  handler: (c) => {
    return c.json(
      {
        error: 'Too many requests. Please slow down.',
      },
      429,
    );
  },
});
