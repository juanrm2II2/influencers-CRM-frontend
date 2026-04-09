/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Each instance tracks request timestamps per key (typically an IP address)
 * and rejects requests that exceed the configured limit within the window.
 *
 * NOTE: This is per-process; in a multi-instance deployment, consider a
 * shared store (e.g. Redis / Vercel KV) instead.
 */

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

export class RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly hits: Map<string, number[]> = new Map();

  constructor(opts: RateLimiterOptions) {
    this.limit = opts.limit;
    this.windowMs = opts.windowMs;
  }

  /**
   * Check whether a request identified by `key` is allowed.
   *
   * @returns `true` if the request is within the rate limit, `false` otherwise.
   */
  check(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const raw = this.hits.get(key);
    // Remove entries that have fallen outside the window.
    const timestamps = raw ? raw.filter((t) => t > windowStart) : [];

    if (timestamps.length >= this.limit) {
      // Still over limit after pruning — reject.
      // Save pruned array back to avoid stale-entry build-up.
      this.hits.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return true;
  }

  /**
   * Evict keys whose most recent request is older than the window.
   * Call periodically (e.g. via setInterval) in long-lived processes to
   * prevent unbounded Map growth.
   */
  evictStale(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, timestamps] of this.hits) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] <= cutoff) {
        this.hits.delete(key);
      }
    }
  }

  /** Remove all tracked data (useful in tests). */
  reset(): void {
    this.hits.clear();
  }
}
