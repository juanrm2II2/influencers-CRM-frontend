import { NextResponse, type NextRequest } from 'next/server';
import { CSP_HEADER_NAME, buildCspHeaderValue } from '@/lib/csp';
import { API_URL } from '@/lib/config';
import { isSafeRedirectTarget } from '@/lib/redirect';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/privacy', '/terms', '/cookie-policy', '/dpa', '/data-practices'];

// Routes that additionally require the authenticated user to have `role === 'admin'`.
// This list is the server-authoritative source of admin-gated pages.
// Values MUST be lowercase, with no trailing slash — see `normalizePath` below.
const ADMIN_PATHS = ['/token-sale/whitelist'];

// ─── Security headers (F-004) ──────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=()',
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security':
    'max-age=63072000; includeSubDomains; preload',
};

/**
 * Canonicalize an incoming request pathname so authorization decisions
 * cannot be bypassed via URL variants such as:
 *   - trailing slashes       (/token-sale/whitelist/)
 *   - mixed case             (/Token-Sale/Whitelist)
 *   - percent-encoded bytes  (/token-sale/%77hitelist)
 *   - repeated slashes       (/token-sale//whitelist)
 *
 * Returns an empty string when the path is malformed so callers can
 * treat it as "no match" and fail closed.
 */
function normalizePath(pathname: string): string {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return '';
  }
  // Collapse any run of slashes into a single slash.
  decoded = decoded.replace(/\/+/g, '/');
  // Lowercase for case-insensitive matching.
  decoded = decoded.toLowerCase();
  // Strip trailing slash (except for the root path).
  if (decoded.length > 1 && decoded.endsWith('/')) {
    decoded = decoded.slice(0, -1);
  }
  return decoded;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPath = normalizePath(pathname);

  // Skip internal Next.js assets and API routes
  if (
    normalizedPath.startsWith('/_next') ||
    normalizedPath.startsWith('/api') ||
    normalizedPath === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // ── Route-level auth guard ──────────────────────────────────────────────
  // NOTE: Token-presence check below is a UX-level guard only; JWT signature
  // and expiration validation happen on the backend for every API call.
  const isPublic = PUBLIC_PATHS.some((p) => normalizedPath === p);

  const token =
    request.cookies.get('crm_access_token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    // Only forward the intended post-login destination when it is a
    // guaranteed same-origin path. This closes an open-redirect vector:
    // without this check, visiting e.g. `//evil.com` would produce
    // `/login?redirect=//evil.com`, which a naive login-page handler
    // could then use for `router.push(redirect)`.
    //
    // We validate *and* forward the already-normalized path so that
    // case / encoding / duplicate-slash variants cannot re-introduce
    // bypass primitives on the consumer side.
    if (isSafeRedirectTarget(normalizedPath)) {
      loginUrl.searchParams.set('redirect', normalizedPath);
    }
    const response = NextResponse.redirect(loginUrl);
    applySecurityHeaders(response);
    return response;
  }

  // Authenticated users visiting /login → redirect to dashboard
  if (isPublic && token) {
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url)
    );
    applySecurityHeaders(response);
    return response;
  }

  // ── Admin-only guard (server-authoritative role check) ─────────────────
  // For admin-gated paths we *cannot* trust the client-side role: we must ask
  // the backend who the authenticated user is. The backend is the only party
  // that can validate the session JWT and return the real role.
  //
  // Matching is performed against the *normalized* path so trailing slashes,
  // mixed case, or percent-encoded characters cannot bypass the gate.
  const isAdminPath = ADMIN_PATHS.some(
    (p) => normalizedPath === p || normalizedPath.startsWith(`${p}/`),
  );
  if (isAdminPath && token) {
    const role = await fetchAuthenticatedRole(request);
    if (role !== 'admin') {
      // Non-admin (or unauthenticated-per-backend) → redirect to token-sale root.
      const redirectUrl = new URL('/token-sale', request.url);
      const response = NextResponse.redirect(redirectUrl);
      applySecurityHeaders(response);
      return response;
    }
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
}

/**
 * Resolve the authenticated user's role by calling the backend's
 * `/api/auth/me` endpoint. Forwards cookies so the backend can validate the
 * session. Returns `null` when the backend rejects the request or is
 * unreachable, in which case callers should treat the user as unauthorized.
 */
async function fetchAuthenticatedRole(request: NextRequest): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        // Forward the incoming cookies so the backend sees the user's session.
        cookie: request.headers.get('cookie') ?? '',
        accept: 'application/json',
      },
      // Edge runtime: avoid caching auth responses.
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as
      | { user?: { role?: string }; role?: string }
      | null;
    return data?.user?.role ?? data?.role ?? null;
  } catch {
    return null;
  }
}

function applySecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set(CSP_HEADER_NAME, buildCspHeaderValue());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
};
