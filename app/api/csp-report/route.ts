import { NextResponse } from 'next/server';

/**
 * POST /api/csp-report
 * Collects Content-Security-Policy violation reports sent by browsers.
 * In production, forward these reports to your monitoring service.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Log CSP violations for monitoring (replace with your monitoring service)
    console.warn('[CSP Violation]', JSON.stringify(body));
  } catch {
    // Malformed report – ignore
  }

  return new NextResponse(null, { status: 204 });
}
