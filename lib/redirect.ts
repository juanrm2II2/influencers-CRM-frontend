/**
 * Validate that a redirect path is a safe, same-origin relative path.
 *
 * Rejects absolute URLs, protocol-relative URLs, and paths that could be
 * abused for open-redirect attacks (e.g. `//evil.com`, `https://evil.com`,
 * or backslash-based bypasses like `\/evil.com`).
 */
export function isSafeRedirectPath(path: string): boolean {
  // Must start with exactly one forward-slash (relative path).
  if (!path.startsWith('/')) return false;

  // Reject protocol-relative URLs ("//…")
  if (path.startsWith('//')) return false;

  // Reject embedded scheme ("://")
  if (path.includes('://')) return false;

  // Reject backslash tricks ("\/evil.com" which some browsers treat as "//evil.com")
  if (path.includes('\\')) return false;

  return true;
}

/**
 * Return a sanitised redirect path, falling back to `fallback` when the
 * supplied value is missing or unsafe.
 */
export function safeRedirectPath(
  path: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!path || !isSafeRedirectPath(path)) return fallback;
  return path;
}
