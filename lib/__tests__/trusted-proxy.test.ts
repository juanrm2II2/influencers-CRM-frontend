import { describe, it, expect } from 'vitest';
import {
  isTrustedProxyDeployment,
  getClientIp,
  UNTRUSTED_PROXY_BUCKET,
} from '../trusted-proxy';

function makeRequest(headers: Record<string, string>) {
  return { headers: new Headers(headers) };
}

describe('isTrustedProxyDeployment', () => {
  it('returns false on an empty environment', () => {
    expect(isTrustedProxyDeployment({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('opts in when TRUSTED_PROXY_CIDRS is set', () => {
    expect(
      isTrustedProxyDeployment({
        TRUSTED_PROXY_CIDRS: '10.0.0.0/8',
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it('does not opt in when TRUSTED_PROXY_CIDRS is whitespace only', () => {
    expect(
      isTrustedProxyDeployment({
        TRUSTED_PROXY_CIDRS: '   ',
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it('opts in on Vercel deployments', () => {
    expect(
      isTrustedProxyDeployment({ VERCEL: '1' } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it('opts in on Railway deployments', () => {
    expect(
      isTrustedProxyDeployment({
        RAILWAY_ENVIRONMENT: 'production',
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it('opts in via the explicit TRUST_PROXY_HEADERS escape hatch', () => {
    expect(
      isTrustedProxyDeployment({
        TRUST_PROXY_HEADERS: 'true',
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(true);
  });

  it('does not treat TRUST_PROXY_HEADERS=false as opt-in', () => {
    expect(
      isTrustedProxyDeployment({
        TRUST_PROXY_HEADERS: 'false',
      } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });
});

describe('getClientIp', () => {
  it('returns UNTRUSTED_PROXY_BUCKET on an untrusted deployment even with x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4' });
    expect(getClientIp(req, {} as NodeJS.ProcessEnv)).toBe(UNTRUSTED_PROXY_BUCKET);
  });

  it('returns the first XFF entry on a trusted deployment', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' });
    expect(
      getClientIp(req, { VERCEL: '1' } as unknown as NodeJS.ProcessEnv),
    ).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip on a trusted deployment when XFF is absent', () => {
    const req = makeRequest({ 'x-real-ip': '1.2.3.4' });
    expect(
      getClientIp(req, { VERCEL: '1' } as unknown as NodeJS.ProcessEnv),
    ).toBe('1.2.3.4');
  });

  it('returns UNTRUSTED_PROXY_BUCKET on a trusted deployment when both proxy headers are missing', () => {
    const req = makeRequest({});
    expect(
      getClientIp(req, { VERCEL: '1' } as unknown as NodeJS.ProcessEnv),
    ).toBe(UNTRUSTED_PROXY_BUCKET);
  });

  it('does not allow an attacker to spoof XFF on an untrusted deployment', () => {
    // Attacker rotates XFF on every request — the limiter would be
    // exhausted if this returned distinct values. Here it must not.
    const a = getClientIp(makeRequest({ 'x-forwarded-for': '1.1.1.1' }), {} as NodeJS.ProcessEnv);
    const b = getClientIp(makeRequest({ 'x-forwarded-for': '2.2.2.2' }), {} as NodeJS.ProcessEnv);
    const c = getClientIp(makeRequest({ 'x-forwarded-for': '3.3.3.3' }), {} as NodeJS.ProcessEnv);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});
