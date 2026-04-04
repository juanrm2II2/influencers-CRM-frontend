import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login'];

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

// ─── Content Security Policy (CSP) ─────────────────────────────────────────
// Enforced mode – blocks resources that violate the policy.
// Violations are reported to the configured report-uri endpoint.
const CSP_HEADER_NAME = 'Content-Security-Policy';

function buildCspHeaderValue(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' https: data:",
    `connect-src 'self' ${apiUrl}`,
    "frame-ancestors 'none'",
    `report-uri ${reportUri}`,
  ];
  return directives.join('; ');
}

export function middleware(request: NextRequest) {
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
  // NOTE: This is a UX-level guard that checks for token *presence* only.
  // Actual JWT signature / expiration validation happens on the backend for
  // every API call.  Adding server-side JWT verification here would require
  // sharing the signing secret with the frontend, which is not recommended.
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

  const response = NextResponse.next();
  applySecurityHeaders(response);
  return response;
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
