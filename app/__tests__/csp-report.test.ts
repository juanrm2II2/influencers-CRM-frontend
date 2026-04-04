import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from '../../app/api/csp-report/route';

describe('CSP Report API route', () => {
  it('returns 204 for valid CSP report', async () => {
    const body = { 'csp-report': { 'document-uri': 'http://localhost' } };
    const request = new Request('http://localhost/api/csp-report', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
  });

  it('returns 204 even for malformed body', async () => {
    const request = new Request('http://localhost/api/csp-report', {
      method: 'POST',
      body: 'not json',
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
  });
});
