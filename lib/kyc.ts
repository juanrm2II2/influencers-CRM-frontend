/**
 * KYC verification API client.
 *
 * Communicates with the backend, which in turn proxies requests to the
 * KYC provider (e.g. SumSub).  The frontend never talks to SumSub directly
 * for API calls – only the WebSDK iframe communicates with SumSub's servers.
 */

import { csrfHeaders } from '@/lib/csrf';
import type { KycVerification, KycAccessToken } from '@/types/web3';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Fetch the current KYC verification status for the authenticated user
 * associated with the given wallet address.
 */
export async function getKycStatus(walletAddress: string): Promise<KycVerification> {
  const res = await fetch(
    `${API_URL}/api/kyc/status?wallet=${encodeURIComponent(walletAddress)}`,
    {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to fetch KYC status (${res.status})`);
  }

  return (await res.json()) as KycVerification;
}

/**
 * Request a short-lived access token for launching the SumSub WebSDK.
 * The backend creates or reuses a SumSub applicant tied to the wallet address.
 */
export async function createKycAccessToken(walletAddress: string): Promise<KycAccessToken> {
  const res = await fetch(`${API_URL}/api/kyc/token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders('POST'),
    },
    body: JSON.stringify({ wallet: walletAddress }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to create KYC token (${res.status})`);
  }

  return (await res.json()) as KycAccessToken;
}
