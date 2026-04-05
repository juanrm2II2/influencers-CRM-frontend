import { RateLimiter } from '@/lib/rate-limit';

/**
 * Shared rate-limiter for the /api/csp-report endpoint.
 * Separated from the route module because Next.js App Router
 * forbids non-handler exports in route files.
 */
export const cspRateLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60_000, // 1 minute
});
