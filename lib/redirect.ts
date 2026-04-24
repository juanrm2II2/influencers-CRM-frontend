/**
 * Shared open-redirect guard for post-authentication navigation.
 *
 * This helper is used both by `middleware.ts` (when forwarding the user's
 * originally-requested path through `?redirect=` on the way to /login) and
 * by `app/login/page.tsx` (when consuming that parameter after a successful
 * sign-in). Keeping a single implementation prevents drift between the
 * producer and consumer of the parameter.
 *
 * Any value that is not a guaranteed same-origin root-relative path must be
 * rejected. In particular we reject:
 *   - absolute URLs (`https://evil.com/foo`)
 *   - protocol-relative URLs (`//evil.com`)
 *   - backslash-smuggled URLs (`/\evil.com`) that some browsers parse as
 *     the authority component
 *   - anything containing a control character, whitespace, or a backslash
 *     anywhere in the path
 *   - excessively long paths
 *
 * Callers that only need to *forward* a path (middleware) should call
 * `isSafeRedirectTarget` directly. Callers that need to *consume* an
 * externally-supplied value (login page) should call `sanitizeRedirectTarget`
 * which returns the validated path or the supplied fallback.
 */

/** Upper bound on redirect length to avoid pathological inputs. */
const MAX_REDIRECT_LENGTH = 512;

export function isSafeRedirectTarget(path: unknown): path is string {
  if (typeof path !== 'string') return false;
  if (path.length === 0 || path.length > MAX_REDIRECT_LENGTH) return false;
  // Must be a relative path rooted at /.
  if (path[0] !== '/') return false;
  // Reject protocol-relative and backslash-smuggled URLs.
  if (path.startsWith('//') || path.startsWith('/\\')) return false;
  // Reject anything containing a control character, whitespace, or a
  // backslash anywhere in the path — these are classic open-redirect
  // bypass vectors in browser URL parsers.
  if (/[\x00-\x1f\x7f\s\\]/.test(path)) return false;
  // Explicitly reject path-traversal segments. Browser URL parsing and
  // Next.js router both normalize `..` segments today, but rejecting
  // them up-front is clearer intent and defends against a future router
  // change that could expose internal routes via `/foo/..` traversal.
  // We split on `/` and look for any segment that is exactly `..` so a
  // legitimate name like `/..foo` is preserved.
  const segments = path.split('/');
  for (const segment of segments) {
    if (segment === '..' || segment === '.') return false;
  }
  return true;
}

/**
 * Return `path` if it is a safe same-origin redirect, otherwise return
 * `fallback`. Use this on the *consuming* side (e.g. the login page reading
 * `?redirect=`) to make it impossible to navigate a user off-origin based on
 * a tampered URL parameter.
 */
export function sanitizeRedirectTarget(path: unknown, fallback: string): string {
  return isSafeRedirectTarget(path) ? path : fallback;
}
