import { describe, it, expect } from 'vitest';
import { isSafeRedirectPath, safeRedirectPath } from '../redirect';

describe('isSafeRedirectPath', () => {
  it('accepts simple relative paths', () => {
    expect(isSafeRedirectPath('/dashboard')).toBe(true);
    expect(isSafeRedirectPath('/influencers/123')).toBe(true);
    expect(isSafeRedirectPath('/settings')).toBe(true);
    expect(isSafeRedirectPath('/')).toBe(true);
  });

  it('rejects protocol-relative URLs', () => {
    expect(isSafeRedirectPath('//evil.com')).toBe(false);
    expect(isSafeRedirectPath('//evil.com/path')).toBe(false);
  });

  it('rejects absolute URLs with scheme', () => {
    expect(isSafeRedirectPath('https://evil.com')).toBe(false);
    expect(isSafeRedirectPath('http://evil.com/path')).toBe(false);
    expect(isSafeRedirectPath('javascript://alert(1)')).toBe(false);
  });

  it('rejects paths that do not start with /', () => {
    expect(isSafeRedirectPath('dashboard')).toBe(false);
    expect(isSafeRedirectPath('')).toBe(false);
  });

  it('rejects backslash-based bypass attempts', () => {
    expect(isSafeRedirectPath('\\/evil.com')).toBe(false);
    expect(isSafeRedirectPath('/foo\\bar')).toBe(false);
  });

  it('rejects embedded scheme in path', () => {
    expect(isSafeRedirectPath('/foo?url=https://evil.com')).toBe(false);
  });
});

describe('safeRedirectPath', () => {
  it('returns the path when safe', () => {
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('/influencers/42')).toBe('/influencers/42');
  });

  it('returns default fallback for unsafe paths', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/dashboard');
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard');
    expect(safeRedirectPath(null)).toBe('/dashboard');
    expect(safeRedirectPath(undefined)).toBe('/dashboard');
    expect(safeRedirectPath('')).toBe('/dashboard');
  });

  it('uses custom fallback when provided', () => {
    expect(safeRedirectPath('//evil.com', '/home')).toBe('/home');
  });
});
