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

    const result = await getKycStatus('0x1234567890123456789012345678901234567890');

    expect(fetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/api/kyc/status?wallet=0x1234567890123456789012345678901234567890`,
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('throws an error when the response is not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });

    await expect(
      getKycStatus('0x1234567890123456789012345678901234567890'),
    ).rejects.toThrow('Unauthorized');
  });

  it('throws a generic error when the body has no message', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('parse error')),
    });

    await expect(
      getKycStatus('0x1234567890123456789012345678901234567890'),
    ).rejects.toThrow('Failed to fetch KYC status (500)');
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

    const result = await createKycAccessToken('0x1234567890123456789012345678901234567890');

    expect(fetch).toHaveBeenCalledWith(
      `${MOCK_API_URL}/api/kyc/token`,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ wallet: '0x1234567890123456789012345678901234567890' }),
      }),
    );
    expect(result).toEqual(mockToken);
  });

  it('throws an error when the response is not ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Forbidden' }),
    });

    await expect(
      createKycAccessToken('0x1234567890123456789012345678901234567890'),
    ).rejects.toThrow('Forbidden');
  });
});
