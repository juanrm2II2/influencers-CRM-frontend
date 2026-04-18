/**
 * Sign-In With Ethereum (EIP-4361) client.
 *
 * Binds the currently connected wallet to the authenticated backend session
 * so downstream APIs (notably KYC) no longer have to accept a `wallet`
 * parameter from the client — the backend reads the wallet from the session.
 *
 * Backend contract (all endpoints share the same session cookies):
 *   GET  /api/auth/siwe/nonce
 *       → { nonce: string }
 *   POST /api/auth/siwe/verify
 *       body: { message: string, signature: `0x${string}` }
 *       → 200 on success (wallet bound to session); non-2xx on failure.
 *   POST /api/auth/siwe/logout
 *       → 204 when the wallet is unbound from the session.
 */

import { createSiweMessage } from 'viem/siwe';
import { csrfHeaders } from '@/lib/csrf';
import { API_URL } from '@/lib/config';

export interface SiweSignFn {
  (args: { message: string; account: `0x${string}` }): Promise<`0x${string}`>;
}

/** Fetch a fresh, server-generated SIWE nonce. */
export async function fetchSiweNonce(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/siwe/nonce`, {
    method: 'GET',
    credentials: 'include',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch SIWE nonce (${res.status})`);
  }
  const data = (await res.json()) as { nonce?: string };
  if (!data?.nonce || typeof data.nonce !== 'string') {
    throw new Error('Malformed SIWE nonce response from backend');
  }
  return data.nonce;
}

/**
 * Build a SIWE message for the given wallet + nonce, targeting the current
 * browser origin. `window.location` is required, so this helper is
 * browser-only.
 */
export function buildSiweMessage(params: {
  address: `0x${string}`;
  chainId: number;
  nonce: string;
  statement?: string;
  issuedAt?: Date;
}): string {
  if (typeof window === 'undefined') {
    throw new Error('buildSiweMessage must be called in the browser');
  }
  const { address, chainId, nonce, statement, issuedAt } = params;
  return createSiweMessage({
    address,
    chainId,
    domain: window.location.host,
    uri: window.location.origin,
    version: '1',
    nonce,
    statement:
      statement ??
      'Sign in with Ethereum to bind this wallet to your account for KYC and token sale access.',
    issuedAt: issuedAt ?? new Date(),
  });
}

/**
 * Send the signed SIWE message to the backend for verification. On success
 * the wallet is bound to the caller's session.
 */
export async function verifySiwe(args: {
  message: string;
  signature: `0x${string}`;
}): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/siwe/verify`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
      ...csrfHeaders('POST'),
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body?.message ?? `SIWE verification failed (${res.status})`,
    );
  }
}

/**
 * Run the full nonce → sign → verify flow.
 *
 * @param address   The connected wallet address.
 * @param chainId   The chain the user is currently on (included in the SIWE message).
 * @param signMessage Adapter that calls the wallet's personal_sign (e.g. wagmi's `signMessageAsync`).
 */
export async function performSiwe(args: {
  address: `0x${string}`;
  chainId: number;
  signMessage: SiweSignFn;
}): Promise<void> {
  const nonce = await fetchSiweNonce();
  const message = buildSiweMessage({
    address: args.address,
    chainId: args.chainId,
    nonce,
  });
  const signature = await args.signMessage({ message, account: args.address });
  await verifySiwe({ message, signature });
}

/** Unbind the wallet from the current session (best-effort). */
export async function siweLogout(): Promise<void> {
  try {
    await fetch(`${API_URL}/api/auth/siwe/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { ...csrfHeaders('POST') },
    });
  } catch {
    // Best effort; caller can ignore.
  }
}
