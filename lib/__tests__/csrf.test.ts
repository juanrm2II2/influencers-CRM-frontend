import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getCsrfToken, csrfHeaders, CSRF_HEADER_NAME } from '../csrf';

describe('lib/csrf', () => {
  afterEach(() => {
    // Clear all cookies
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0];
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  });

  describe('getCsrfToken', () => {
    it('returns empty string when XSRF-TOKEN cookie is absent', () => {
      expect(getCsrfToken()).toBe('');
    });

    it('reads XSRF-TOKEN cookie value', () => {
      document.cookie = 'XSRF-TOKEN=abc123; path=/';
      expect(getCsrfToken()).toBe('abc123');
    });

    it('decodes URI-encoded cookie values', () => {
      document.cookie = `XSRF-TOKEN=${encodeURIComponent('tok/en+val')}; path=/`;
      expect(getCsrfToken()).toBe('tok/en+val');
    });

    it('picks the right cookie among multiple cookies', () => {
      document.cookie = 'other=xyz; path=/';
      document.cookie = 'XSRF-TOKEN=correct; path=/';
      document.cookie = 'another=123; path=/';
      expect(getCsrfToken()).toBe('correct');
    });
  });

  describe('csrfHeaders', () => {
    beforeEach(() => {
      document.cookie = 'XSRF-TOKEN=test-token; path=/';
    });

    it('returns CSRF header for POST', () => {
      expect(csrfHeaders('POST')).toEqual({ [CSRF_HEADER_NAME]: 'test-token' });
    });

    it('returns CSRF header for PUT', () => {
      expect(csrfHeaders('PUT')).toEqual({ [CSRF_HEADER_NAME]: 'test-token' });
    });

    it('returns CSRF header for PATCH', () => {
      expect(csrfHeaders('PATCH')).toEqual({ [CSRF_HEADER_NAME]: 'test-token' });
    });

    it('returns CSRF header for DELETE', () => {
      expect(csrfHeaders('DELETE')).toEqual({ [CSRF_HEADER_NAME]: 'test-token' });
    });

    it('returns empty object for GET', () => {
      expect(csrfHeaders('GET')).toEqual({});
    });

    it('returns empty object when method is undefined', () => {
      expect(csrfHeaders()).toEqual({});
    });

    it('returns empty object when cookie is absent', () => {
      // Clear cookies
      document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      expect(csrfHeaders('POST')).toEqual({});
    });

    it('is case-insensitive on method', () => {
      expect(csrfHeaders('post')).toEqual({ [CSRF_HEADER_NAME]: 'test-token' });
      expect(csrfHeaders('Delete')).toEqual({ [CSRF_HEADER_NAME]: 'test-token' });
    });
  });
});
