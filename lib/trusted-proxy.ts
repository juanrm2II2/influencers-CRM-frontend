/**
 * Trusted-proxy / client-IP resolution helper (audit L-08).
 *
 * The platform reverse-proxy on Vercel / Railway overwrites
 * `x-forwarded-for` and `x-real-ip` so they cannot be spoofed. On a
 * misconfigured deployment behind a different proxy (or one served
 * direct-to-origin) those headers are attacker-controlled — a unique
 * value per request lets an attacker exhaust an in-memory rate limiter
 * and evict legitimate IPs. We therefore only honour the proxy headers
 * when one of the following is true:
 *
 *   1. `TRUSTED_PROXY_CIDRS` is non-empty — the operator has explicitly
 *      asserted that the request hop is trusted (the CIDR list itself
 *      is informational on the Edge runtime, which has no socket-level
 *      remote address; the *presence* of the variable is the opt-in).
 *   2. `VERCEL=1` — Vercel always normalises `x-forwarded-for`.
 *   3. `RAILWAY_ENVIRONMENT` is set — Railway's proxy ditto.
 *   4. `TRUST_PROXY_HEADERS=true` — explicit opt-in for self-hosted
 *      deployments behind a known-good reverse proxy (nginx, Caddy,
 *      Cloudflare) that overwrites these headers.
 *
 * Otherwise we collapse all reports into a single `untrusted-proxy`
 * bucket so the rate ceiling is enforced *globally* rather than per
 * attacker-controlled header value. This is a safer failure mode: the
 * limiter still works, it just stops being per-IP until the operator
 * configures the trust opt-in.
 *
 * Document the deployment requirement in `docs/SECURITY_CONTACTS.md`.
 */

/**
 * Sentinel used by {@link getClientIp} when proxy headers cannot be
 * trusted. Exported for tests and assertion sites.
 */
export const UNTRUSTED_PROXY_BUCKET = 'untrusted-proxy';

/**
 * Returns true when the deployment is configured such that the proxy
 * headers (`x-forwarded-for` / `x-real-ip`) are platform-normalised
 * and therefore safe to use for rate-limit keying.
 */
export function isTrustedProxyDeployment(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  const cidrs = env.TRUSTED_PROXY_CIDRS;
  if (typeof cidrs === 'string' && cidrs.trim() !== '') return true;
  if (env.VERCEL === '1') return true;
  if (
    typeof env.RAILWAY_ENVIRONMENT === 'string' &&
    env.RAILWAY_ENVIRONMENT.trim() !== ''
  ) {
    return true;
  }
  if (env.TRUST_PROXY_HEADERS === 'true') return true;
  return false;
}

/**
 * Resolve a stable rate-limit key from a Web `Request`. When the
 * deployment is not behind a trusted proxy we deliberately collapse
 * every request into a single bucket — the limiter then enforces the
 * ceiling globally instead of per attacker-controlled header.
 */
export function getClientIp(
  request: { headers: Headers | { get: (k: string) => string | null } },
  env: NodeJS.ProcessEnv = process.env,
): string {
  if (!isTrustedProxyDeployment(env)) {
    return UNTRUSTED_PROXY_BUCKET;
  }
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get('x-real-ip');
  if (real) return real;
  // Trusted-proxy deployment but the headers are missing — fall back
  // to the global bucket rather than an attacker-spoofable default.
  return UNTRUSTED_PROXY_BUCKET;
}
