// ─── CSRF token helpers ────────────────────────────────────────────────────
// The backend sets a non-httpOnly cookie (XSRF-TOKEN) containing a CSRF token.
// For every state-changing request (POST / PATCH / PUT / DELETE) the frontend
// must send the token back in the X-XSRF-TOKEN header so the server can
// validate the Double Submit Cookie pattern.

/** Name of the cookie the backend writes the CSRF token into. */
export const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

/** Name of the header the backend expects the CSRF token in. */
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/** HTTP methods that require the CSRF header. */
export const CSRF_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/**
 * Read a cookie value by name from `document.cookie`.
 * Returns `undefined` when running on the server or when the cookie is absent.
 */
export function getCookieValue(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  const match = document.cookie
    .split(/;\s*/)
    .find((row) => row.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.substring(name.length + 1)) : undefined;
}

/**
 * Read the current CSRF token from the `XSRF-TOKEN` cookie.
 */
export function getCsrfToken(): string | undefined {
  return getCookieValue(CSRF_COOKIE_NAME);
}
