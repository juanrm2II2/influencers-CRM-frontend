import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchSiweNonce,
  verifySiwe,
  buildSiweMessage,
  performSiwe,
  invalidateSiweNonceCache,
  __resetSiweNonceStateForTests,
  SiweRateLimitedError,
} from '../siwe';

const MOCK_API_URL = 'http://localhost:3001';

describe('SIWE client', () => {
  beforeEach(() => {
    __resetSiweNonceStateForTests();
    vi.stubGlobal('fetch', vi.fn());
    // buildSiweMessage requires window.location; jsdom provides it.
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchSiweNonce', () => {
    it('returns nonce on success', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: 'abc123' }),
      });

      const nonce = await fetchSiweNonce();

      expect(nonce).toBe('abc123');
      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_API_URL}/api/auth/siwe/nonce`,
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      );
    });

    it('throws when response is not ok', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(fetchSiweNonce()).rejects.toThrow('Failed to fetch SIWE nonce (500)');
    });

    it('throws on malformed nonce payload', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await expect(fetchSiweNonce()).rejects.toThrow('Malformed SIWE nonce response from backend');
    });

    it('caches the nonce so concurrent callers share a single request', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: 'cached-nonce' }),
      });

      const [a, b] = await Promise.all([fetchSiweNonce(), fetchSiweNonce()]);

      expect(a).toBe('cached-nonce');
      expect(b).toBe('cached-nonce');
      // Only one network call despite two concurrent fetches.
      expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
    });

    it('throttles a second non-cached fetch with SiweRateLimitedError', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: 'first' }),
      });

      await fetchSiweNonce();
      // Force the cache to expire so the next call would normally hit the network.
      invalidateSiweNonceCache();

      await expect(fetchSiweNonce()).rejects.toBeInstanceOf(SiweRateLimitedError);
    });

    it('surfaces a backend 429 as SiweRateLimitedError', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: (h: string) => (h === 'retry-after' ? '12' : null) },
        json: async () => ({}),
      });

      await expect(fetchSiweNonce()).rejects.toBeInstanceOf(SiweRateLimitedError);
    });
  });

  describe('buildSiweMessage', () => {
    it('includes the address, chainId, nonce, and current origin', () => {
      const msg = buildSiweMessage({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        nonce: 'noncexyz123',
        issuedAt: new Date('2026-01-01T00:00:00Z'),
      });

      expect(msg).toContain('0x1234567890123456789012345678901234567890');
      expect(msg).toContain('Chain ID: 1');
      expect(msg).toContain('Nonce: noncexyz123');
      // jsdom default is http://localhost
      expect(msg).toContain('localhost');
    });
  });

  describe('verifySiwe', () => {
    it('POSTs message and signature to the backend', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await verifySiwe({
        message: 'siwe-message',
        signature: '0xdeadbeef',
      });

      expect(fetch).toHaveBeenCalledWith(
        `${MOCK_API_URL}/api/auth/siwe/verify`,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: JSON.stringify({ message: 'siwe-message', signature: '0xdeadbeef' }),
        }),
      );
    });

    it('throws with backend-provided error message', async () => {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid signature' }),
      });

      await expect(
        verifySiwe({ message: 'x', signature: '0x00' }),
      ).rejects.toThrow('Invalid signature');
    });
  });

  describe('performSiwe', () => {
    it('chains nonce → sign → verify and passes the signed message through', async () => {
      // 1st fetch = nonce, 2nd fetch = verify
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nonce: 'nonceabc123' }),
      });
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const signMessage = vi.fn(async ({ message }: { message: string }) => {
        expect(message).toContain('Nonce: nonceabc123');
        // SIWE message is bound to EXPECTED_CHAIN_ID (1 in tests).
        expect(message).toContain('Chain ID: 1');
        return '0xsigned' as `0x${string}`;
      });

      await performSiwe({
        address: '0x1234567890123456789012345678901234567890',
        signMessage,
      });

      expect(signMessage).toHaveBeenCalledOnce();
      const verifyCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(verifyCall[0]).toBe(`${MOCK_API_URL}/api/auth/siwe/verify`);
      const body = JSON.parse(verifyCall[1].body as string);
      expect(body.signature).toBe('0xsigned');
      expect(body.message).toContain('Nonce: nonceabc123');
      expect(body.message).toContain('Chain ID: 1');
    });

    it('rejects a caller-supplied chainId that does not match EXPECTED_CHAIN_ID', async () => {
      await expect(
        performSiwe({
          address: '0x1234567890123456789012345678901234567890',
          chainId: 137,
          signMessage: vi.fn(),
        }),
      ).rejects.toThrow(/EXPECTED_CHAIN_ID/);
      expect(fetch).not.toHaveBeenCalled();
    });
  });
});
