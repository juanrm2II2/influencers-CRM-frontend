import { NextResponse } from 'next/server';
import { cspRateLimiter } from '@/lib/csp-rate-limiter';

/**
 * POST /api/csp-report
 * Collects Content-Security-Policy violation reports sent by browsers.
 * In production, forward these reports to your monitoring service.
 *
 * Protections:
 *  - Rate limited to 10 requests / minute per IP.
 *  - Content-Type must be application/csp-report or application/json.
 *  - Request body must not exceed 10 KB.
 */

const MAX_BODY_BYTES = 10 * 1024; // 10 KB

const ALLOWED_CONTENT_TYPES = [
  'application/csp-report',
  'application/json',
];

function getClientIp(request: Request): string {
  const headers = request.headers;
  // Vercel / common reverse-proxy headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request: Request) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip = getClientIp(request);

  if (!cspRateLimiter.check(ip)) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
    });
  }

  // ── Content-Type validation ──────────────────────────────────────────────
  const contentType = request.headers
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();

  if (!contentType || !ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return new NextResponse(
      JSON.stringify({ error: 'Unsupported Media Type' }),
      {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // ── Body size limit ──────────────────────────────────────────────────────
  const rawBody = await request.text();

  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return new NextResponse(
      JSON.stringify({ error: 'Payload Too Large' }),
      {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // ── Process report ───────────────────────────────────────────────────────
  try {
    const body = JSON.parse(rawBody);
    // Log CSP violations for monitoring (replace with your monitoring service)
    console.warn('[CSP Violation]', JSON.stringify(body));
  } catch {
    // Malformed report – ignore
  }

  return new NextResponse(null, { status: 204 });
}
