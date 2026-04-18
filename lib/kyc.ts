/**
 * KYC verification API client.
 *
 * Communicates with the backend, which in turn proxies requests to the
 * KYC provider (e.g. SumSub).  The frontend never talks to SumSub directly
 * for API calls – only the WebSDK iframe communicates with SumSub's servers.
 *
 * NOTE: The client no longer sends a wallet address with these requests.
 * The backend resolves the wallet from the SIWE-bound session (see
 * lib/web3/siwe.ts). This closes a class of bugs where the client could
 * query/mutate KYC state for an arbitrary wallet by spoofing the parameter.
 */

import { csrfHeaders } from '@/lib/csrf';
import type { KycVerification, KycAccessToken } from '@/types/web3';
import { API_URL } from '@/lib/config';

/**
 * Fetch the current KYC verification status for the authenticated user.
 * The backend uses the SIWE-bound session wallet; callers must not pass
 * a wallet address.
 */
export async function getKycStatus(): Promise<KycVerification> {
  const res = await fetch(`${API_URL}/api/kyc/status`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to fetch KYC status (${res.status})`);
  }

  return (await res.json()) as KycVerification;
}

/**
 * Request a short-lived access token for launching the SumSub WebSDK.
 * The backend creates or reuses a SumSub applicant tied to the session
 * wallet bound via SIWE.
 */
export async function createKycAccessToken(): Promise<KycAccessToken> {
  const res = await fetch(`${API_URL}/api/kyc/token`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...csrfHeaders('POST'),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to create KYC token (${res.status})`);
  }

  return (await res.json()) as KycAccessToken;
}
