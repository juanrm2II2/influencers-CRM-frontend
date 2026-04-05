import { describe, it, expect, afterEach } from 'vitest';
import {
  getCookieValue,
  getCsrfToken,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_METHODS,
} from '../csrf';

describe('lib/csrf', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'cookie'
  );

  afterEach(() => {
    // Restore original cookie descriptor
    if (originalCookie) {
      Object.defineProperty(Document.prototype, 'cookie', originalCookie);
    }
  });

  // Helper to mock document.cookie
  function setCookie(value: string) {
    Object.defineProperty(document, 'cookie', {
      get: () => value,
      configurable: true,
    });
  }

  describe('constants', () => {
    it('exports the expected cookie name', () => {
      expect(CSRF_COOKIE_NAME).toBe('XSRF-TOKEN');
    });

    it('exports the expected header name', () => {
      expect(CSRF_HEADER_NAME).toBe('X-XSRF-TOKEN');
    });

    it('includes all state-changing HTTP methods', () => {
      expect(CSRF_METHODS.has('post')).toBe(true);
      expect(CSRF_METHODS.has('put')).toBe(true);
      expect(CSRF_METHODS.has('patch')).toBe(true);
      expect(CSRF_METHODS.has('delete')).toBe(true);
      expect(CSRF_METHODS.has('get')).toBe(false);
    });
  });

  describe('getCookieValue', () => {
    it('returns the value of an existing cookie', () => {
      setCookie('XSRF-TOKEN=abc123; other=value');
      expect(getCookieValue('XSRF-TOKEN')).toBe('abc123');
    });

    it('returns undefined for a missing cookie', () => {
      setCookie('other=value');
      expect(getCookieValue('XSRF-TOKEN')).toBeUndefined();
    });

    it('returns undefined when document.cookie is empty', () => {
      setCookie('');
      expect(getCookieValue('XSRF-TOKEN')).toBeUndefined();
    });

    it('decodes URI-encoded cookie values', () => {
      setCookie('XSRF-TOKEN=hello%20world');
      expect(getCookieValue('XSRF-TOKEN')).toBe('hello world');
    });

    it('handles cookies with equals signs in the value', () => {
      setCookie('XSRF-TOKEN=abc=123');
      expect(getCookieValue('XSRF-TOKEN')).toBe('abc=123');
    });

    it('does not match partial cookie names', () => {
      setCookie('MY-XSRF-TOKEN=wrong; XSRF-TOKEN=right');
      expect(getCookieValue('XSRF-TOKEN')).toBe('right');
    });
  });

  describe('getCsrfToken', () => {
    it('returns the XSRF-TOKEN cookie value', () => {
      setCookie('XSRF-TOKEN=token123');
      expect(getCsrfToken()).toBe('token123');
    });

    it('returns undefined when no XSRF-TOKEN cookie exists', () => {
      setCookie('session=abc');
      expect(getCsrfToken()).toBeUndefined();
    });
  });
});
