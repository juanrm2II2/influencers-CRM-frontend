import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getKycStatus, createKycAccessToken } from '../kyc';

const MOCK_API_URL = 'http://localhost:3001';

describe('getKycStatus', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns KYC verification data on success', async () => {
    const mockData = { status: 'approved', updatedAt: '2026-01-01T00:00:00Z' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const result = await getKycStatus();

    expect(fetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/api/kyc/status`,
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('does not include a wallet query parameter in the request URL', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'none' }),
    });

    await getKycStatus();

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain('wallet=');
    expect(url).not.toContain('?');
  });

  it('throws an error when the response is not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    await expect(getKycStatus()).rejects.toThrow('Unauthorized');
  });

  it('throws a generic error when the body has no message', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(getKycStatus()).rejects.toThrow('Failed to fetch KYC status (500)');
  });
});

describe('createKycAccessToken', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an access token on success', async () => {
    const mockToken = { token: 'test-token', applicantId: 'app-123' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockToken),
    });

    const result = await createKycAccessToken();

    expect(fetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/api/kyc/token`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    );
    expect(result).toEqual(mockToken);
  });

  it('does not include a wallet field in the request body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 't', applicantId: 'a' }),
    });

    await createKycAccessToken();

    const init = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit | undefined;
    // Body is either omitted entirely or does not carry a `wallet` field.
    if (init?.body != null) {
      expect(String(init.body)).not.toContain('wallet');
    }
  });

  it('throws an error when the response is not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    });

    await expect(createKycAccessToken()).rejects.toThrow('Forbidden');
  });
});
