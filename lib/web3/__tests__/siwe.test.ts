import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSiweNonce, verifySiwe, buildSiweMessage, performSiwe } from '../siwe';

const MOCK_API_URL = 'http://localhost:3001';

describe('SIWE client', () => {
  beforeEach(() => {
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
        return '0xsigned' as `0x${string}`;
      });

      await performSiwe({
        address: '0x1234567890123456789012345678901234567890',
        chainId: 1,
        signMessage,
      });

      expect(signMessage).toHaveBeenCalledOnce();
      const verifyCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[1];
      expect(verifyCall[0]).toBe(`${MOCK_API_URL}/api/auth/siwe/verify`);
      const body = JSON.parse(verifyCall[1].body as string);
      expect(body.signature).toBe('0xsigned');
      expect(body.message).toContain('Nonce: nonceabc123');
    });
  });
});
