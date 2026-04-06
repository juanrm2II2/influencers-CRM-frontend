import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' https: data:",
    `connect-src 'self' ${supabaseUrl}`,
    "frame-ancestors 'none'",
    `report-uri ${reportUri}`,
  ];
  return directives.join('; ');
}

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

  // ── Supabase session refresh + auth guard ─────────────────────────────
  const { user, supabaseResponse } = await updateSession(request);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p);

  if (!isPublic && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    const response = NextResponse.redirect(loginUrl);
    applySecurityHeaders(response);
    return response;
  }

  // Authenticated users visiting /login → redirect to dashboard
  if (isPublic && user) {
    const response = NextResponse.redirect(
      new URL('/dashboard', request.url),
    );
    applySecurityHeaders(response);
    return response;
  }

  applySecurityHeaders(supabaseResponse);
  return supabaseResponse;
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
