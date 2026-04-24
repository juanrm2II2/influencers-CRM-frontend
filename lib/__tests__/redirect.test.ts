import { describe, it, expect } from 'vitest';
import { isSafeRedirectTarget, sanitizeRedirectTarget } from '../redirect';

describe('isSafeRedirectTarget', () => {
  it('accepts simple same-origin paths', () => {
    expect(isSafeRedirectTarget('/dashboard')).toBe(true);
    expect(isSafeRedirectTarget('/token-sale/whitelist')).toBe(true);
    expect(isSafeRedirectTarget('/')).toBe(true);
  });

  it('rejects absolute URLs', () => {
    expect(isSafeRedirectTarget('https://evil.com/foo')).toBe(false);
    expect(isSafeRedirectTarget('http://evil.com')).toBe(false);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRedirectTarget('//evil.com')).toBe(false);
    expect(isSafeRedirectTarget('//evil.com/dashboard')).toBe(false);
  });

  it('rejects backslash-smuggled URLs', () => {
    expect(isSafeRedirectTarget('/\\evil.com')).toBe(false);
    expect(isSafeRedirectTarget('/foo\\bar')).toBe(false);
  });

  it('rejects paths with control characters or whitespace', () => {
    expect(isSafeRedirectTarget('/foo\nbar')).toBe(false);
    expect(isSafeRedirectTarget('/foo\x00bar')).toBe(false);
    expect(isSafeRedirectTarget('/foo bar')).toBe(false);
  });

  it('rejects empty, too-long, and non-string values', () => {
    expect(isSafeRedirectTarget('')).toBe(false);
    expect(isSafeRedirectTarget('/' + 'a'.repeat(600))).toBe(false);
    expect(isSafeRedirectTarget(undefined)).toBe(false);
    expect(isSafeRedirectTarget(null)).toBe(false);
    expect(isSafeRedirectTarget(42 as unknown)).toBe(false);
  });

  it('rejects paths that do not start with /', () => {
    expect(isSafeRedirectTarget('dashboard')).toBe(false);
    expect(isSafeRedirectTarget('javascript:alert(1)')).toBe(false);
  });
});

describe('sanitizeRedirectTarget', () => {
  it('returns the path when safe', () => {
    expect(sanitizeRedirectTarget('/dashboard', '/')).toBe('/dashboard');
  });

  it('returns the fallback when unsafe', () => {
    expect(sanitizeRedirectTarget('//evil.com', '/dashboard')).toBe('/dashboard');
    expect(sanitizeRedirectTarget(undefined, '/dashboard')).toBe('/dashboard');
  });
});
