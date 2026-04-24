/**
 * Simple sliding-window rate limiter.
 *
 * Each instance tracks request timestamps per key (typically an IP address)
 * and rejects requests that exceed the configured limit within the window.
 *
 * The storage layer is pluggable via {@link RateLimitStore}. The default
 * implementation is an in-process `Map`, which is only correct for
 * single-instance deployments. For multi-instance or serverless
 * environments, inject a shared store (Redis / Upstash / Vercel KV)
 * that implements the same interface.
 */

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. */
  limit: number;
  /** Time window in milliseconds. */
  windowMs: number;
  /** Optional shared store; defaults to an in-memory Map. */
  store?: RateLimitStore;
}

/**
 * Pluggable storage backend for {@link RateLimiter}. Implementations must
 * be safe for concurrent access across all replicas that share a key
 * namespace.
 */
export interface RateLimitStore {
  get(key: string): number[] | undefined;
  set(key: string, timestamps: number[]): void;
  delete(key: string): void;
  entries(): IterableIterator<[string, number[]]>;
}

class MemoryRateLimitStore implements RateLimitStore {
  private readonly map = new Map<string, number[]>();
  get(key: string): number[] | undefined {
    return this.map.get(key);
  }
  set(key: string, timestamps: number[]): void {
    this.map.set(key, timestamps);
  }
  delete(key: string): void {
    this.map.delete(key);
  }
  entries(): IterableIterator<[string, number[]]> {
    return this.map.entries();
  }
}

export class RateLimiter {
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly store: RateLimitStore;

  constructor(opts: RateLimiterOptions) {
    this.limit = opts.limit;
    this.windowMs = opts.windowMs;
    this.store = opts.store ?? new MemoryRateLimitStore();
  }

  /**
   * Check whether a request identified by `key` is allowed.
   *
   * @returns `true` if the request is within the rate limit, `false` otherwise.
   */
  check(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const raw = this.store.get(key);
    // Remove entries that have fallen outside the window.
    const timestamps = raw ? raw.filter((t) => t > windowStart) : [];

    if (timestamps.length >= this.limit) {
      // Still over limit after pruning — reject.
      // Save pruned array back to avoid stale-entry build-up.
      this.store.set(key, timestamps);
      return false;
    }

    timestamps.push(now);
    this.store.set(key, timestamps);
    return true;
  }

  /**
   * Evict keys whose most recent request is older than the window.
   * Call periodically (e.g. via setInterval) in long-lived processes to
   * prevent unbounded store growth.
   */
  evictStale(): void {
    const cutoff = Date.now() - this.windowMs;
    for (const [key, timestamps] of this.store.entries()) {
      if (timestamps.length === 0 || timestamps[timestamps.length - 1] < cutoff) {
        this.store.delete(key);
      }
    }
  }

  /** Remove all tracked data (useful in tests). */
  reset(): void {
    for (const [key] of this.store.entries()) {
      this.store.delete(key);
    }
  }
}
