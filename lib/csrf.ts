/**
 * CSRF protection using the Double Submit Cookie pattern.
 *
 * The backend sets a non-httpOnly cookie named `XSRF-TOKEN` on every
 * authenticated response.  The frontend reads that cookie and echoes its
 * value back in the `X-XSRF-TOKEN` request header for every state-changing
 * request (POST / PUT / PATCH / DELETE).  The backend then verifies that the
 * header matches the cookie value.
 */

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
export const CSRF_HEADER_NAME = 'X-XSRF-TOKEN';

/**
 * Read the XSRF-TOKEN cookie value from `document.cookie`.
 * Returns an empty string when running server-side or when the cookie is absent.
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CSRF_COOKIE_NAME}=`));

  return match ? decodeURIComponent(match.split('=')[1]) : '';
}

/** HTTP methods that require CSRF protection. */
export const CSRF_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/**
 * Build a `Record<string, string>` containing the CSRF header if a token
 * is present and the method is state-changing.  Returns an empty object
 * otherwise (safe to spread into any headers object).
 */
export function csrfHeaders(method?: string): Record<string, string> {
  if (!method || !CSRF_METHODS.has(method.toLowerCase())) return {};
  const token = getCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}
