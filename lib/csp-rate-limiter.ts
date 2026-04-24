import { RateLimiter, type RateLimitStore } from '@/lib/rate-limit';

/**
 * Shared rate-limiter for the /api/csp-report endpoint.
 * Separated from the route module because Next.js App Router
 * forbids non-handler exports in route files.
 *
 * The limiter is backed by a pluggable {@link RateLimitStore}. In
 * single-process / dev environments the default in-memory store is
 * sufficient. For multi-instance or serverless deployments, inject a
 * shared store (Redis/Upstash/Vercel KV) via the `rateLimitStore`
 * property on `globalThis` before this module is first imported —
 * e.g. from `instrumentation.ts`:
 *
 * ```ts
 * // instrumentation.ts
 * import { RedisRateLimitStore } from '@/lib/rate-limit-redis';
 * (globalThis as { rateLimitStore?: RateLimitStore }).rateLimitStore =
 *   new RedisRateLimitStore({ url: process.env.REDIS_URL });
 * ```
 *
 * Keeping the hook here (rather than hard-coding the memory store)
 * means multiple Edge replicas do not each enforce their own sliding
 * window and allow `10 * N` reports per minute in aggregate.
 */
const sharedStore = (globalThis as { rateLimitStore?: RateLimitStore })
  .rateLimitStore;

export const cspRateLimiter = new RateLimiter({
  limit: 10,
  windowMs: 60_000, // 1 minute
  store: sharedStore,
});
