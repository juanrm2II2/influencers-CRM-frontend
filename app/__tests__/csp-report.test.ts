import { describe, it, expect, beforeEach } from 'vitest';
import { POST, cspRateLimiter } from '../../app/api/csp-report/route';

/** Helper to build a Request with sensible defaults for CSP reports. */
function buildRequest(
  overrides: {
    body?: string;
    contentType?: string;
    ip?: string;
  } = {},
) {
  const {
    body = JSON.stringify({ 'csp-report': { 'document-uri': 'http://localhost' } }),
    contentType = 'application/csp-report',
    ip = '1.2.3.4',
  } = overrides;

  const headers: Record<string, string> = { 'x-forwarded-for': ip };
  if (contentType) headers['Content-Type'] = contentType;

  return new Request('http://localhost/api/csp-report', {
    method: 'POST',
    body,
    headers,
  });
}

describe('CSP Report API route', () => {
  beforeEach(() => {
    cspRateLimiter.reset();
  });

  // ── Basic functionality ──────────────────────────────────────────────────

  it('returns 204 for valid CSP report', async () => {
    const request = buildRequest();
    const response = await POST(request);

    expect(response.status).toBe(204);
  });

  it('returns 204 for valid report with application/json content type', async () => {
    const request = buildRequest({ contentType: 'application/json' });
    const response = await POST(request);

    expect(response.status).toBe(204);
  });

  it('returns 204 even for malformed body', async () => {
    const request = buildRequest({ body: 'not json' });
    const response = await POST(request);

    expect(response.status).toBe(204);
  });

  // ── Content-Type validation ──────────────────────────────────────────────

  it('returns 415 when Content-Type header is missing', async () => {
    const request = new Request('http://localhost/api/csp-report', {
      method: 'POST',
      body: '{}',
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });

    const response = await POST(request);

    expect(response.status).toBe(415);
    const json = await response.json();
    expect(json.error).toBe('Unsupported Media Type');
  });

  it('returns 415 for unsupported Content-Type', async () => {
    const request = buildRequest({ contentType: 'text/plain' });
    const response = await POST(request);

    expect(response.status).toBe(415);
  });

  it('accepts Content-Type with charset parameter', async () => {
    const request = buildRequest({ contentType: 'application/csp-report; charset=utf-8' });
    const response = await POST(request);

    expect(response.status).toBe(204);
  });

  // ── Body size limit ──────────────────────────────────────────────────────

  it('returns 413 when body exceeds 10 KB', async () => {
    const oversizedBody = 'x'.repeat(10 * 1024 + 1);
    const request = buildRequest({ body: oversizedBody });
    const response = await POST(request);

    expect(response.status).toBe(413);
    const json = await response.json();
    expect(json.error).toBe('Payload Too Large');
  });

  it('accepts body exactly at 10 KB', async () => {
    const maxBody = 'x'.repeat(10 * 1024);
    const request = buildRequest({ body: maxBody });
    const response = await POST(request);

    // Body is not valid JSON, so it falls through to malformed handling → 204
    expect(response.status).toBe(204);
  });

  // ── Rate limiting ────────────────────────────────────────────────────────

  it('allows up to 10 requests per IP within the window', async () => {
    for (let i = 0; i < 10; i++) {
      const response = await POST(buildRequest());
      expect(response.status).toBe(204);
    }
  });

  it('returns 429 after exceeding 10 requests per IP', async () => {
    // Exhaust the limit
    for (let i = 0; i < 10; i++) {
      await POST(buildRequest());
    }

    const response = await POST(buildRequest());

    expect(response.status).toBe(429);
    const json = await response.json();
    expect(json.error).toBe('Too Many Requests');
    expect(response.headers.get('Retry-After')).toBe('60');
  });

  it('rate limits per IP independently', async () => {
    // Exhaust limit for IP A
    for (let i = 0; i < 10; i++) {
      await POST(buildRequest({ ip: '10.0.0.1' }));
    }

    // IP B should still be allowed
    const response = await POST(buildRequest({ ip: '10.0.0.2' }));
    expect(response.status).toBe(204);
  });
});
