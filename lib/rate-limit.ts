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

    let timestamps = this.hits.get(key);
    if (timestamps) {
      // Remove entries that have fallen outside the window.
      timestamps = timestamps.filter((t) => t > windowStart);
    } else {
      timestamps = [];
    }

    if (timestamps.length >= this.limit) {
      // Still over limit after pruning — reject.
      // Only update stored timestamps when pruning removed entries.
      return false;
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    return true;
  }

  /** Remove all tracked data (useful in tests). */
  reset(): void {
    this.hits.clear();
  }
}
