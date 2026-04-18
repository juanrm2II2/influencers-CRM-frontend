import { NextResponse, type NextRequest } from 'next/server';
import { CSP_HEADER_NAME, buildCspHeaderValue } from '@/lib/csp';
import { API_URL } from '@/lib/config';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/privacy', '/terms', '/cookie-policy', '/dpa', '/data-practices'];

// Routes that additionally require the authenticated user to have `role === 'admin'`.
// This list is the server-authoritative source of admin-gated pages.
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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip internal Next.js assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // ── Route-level auth guard ──────────────────────────────────────────────
  // NOTE: Token-presence check below is a UX-level guard only; JWT signature
  // and expiration validation happen on the backend for every API call.
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);

  const token =
    request.cookies.get('crm_access_token')?.value ??
    request.headers.get('authorization')?.replace('Bearer ', '');

  if (!isPublic && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
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
  const isAdminPath = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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
