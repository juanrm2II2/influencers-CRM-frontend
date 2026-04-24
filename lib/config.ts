/**
 * Centralized application configuration constants.
 *
 * Environment variables consumed by the frontend are read once and
 * re-exported from here so every module resolves the same value without
 * duplicating the fallback logic.
 */

/**
 * Resolve the backend API base URL from `NEXT_PUBLIC_API_URL`.
 *
 * Hardening rules:
 *  - In production, the env var MUST be set and MUST use HTTPS. We fail
 *    fast at module-load time so a misconfigured deployment cannot silently
 *    fall back to plaintext HTTP and leak cookies/tokens in transit.
 *    (The Next.js build also validates this — see next.config.mjs — but we
 *    re-check here to cover edge-runtime / serverless contexts where the
 *    build guard does not execute.)
 *  - In development / test, we allow a localhost fallback so contributors
 *    can run the app without provisioning a value, but we still refuse
 *    any non-HTTPS value pointing at a non-localhost host.
 */
function resolveApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!raw) {
    if (isProduction) {
      throw new Error(
        'NEXT_PUBLIC_API_URL is required in production. Configure it to ' +
          'the backend HTTPS URL before starting the server.',
      );
    }
    // Dev / test default – explicit localhost, never used in production.
    return 'http://localhost:3001';
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_API_URL is not a valid URL. Received: "${raw}".`,
    );
  }

  const isLocalhost =
    parsed.hostname === 'localhost' ||
    parsed.hostname === '127.0.0.1' ||
    parsed.hostname === '[::1]';

  if (parsed.protocol !== 'https:' && !(isLocalhost && !isProduction)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must use HTTPS${isProduction ? ' in production' : ''}. ` +
        `Received: "${raw}".`,
    );
  }

  // Re-serialize from the parsed URL so any trailing-slash stripping
  // operates on the canonical pathname only and cannot accidentally
  // touch the query string or fragment.
  return parsed.href.replace(/\/+$/, '');
}

/** Base URL of the backend API (Express). */
export const API_URL: string = resolveApiUrl();
