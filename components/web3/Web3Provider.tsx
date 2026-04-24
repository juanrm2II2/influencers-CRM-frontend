'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '@/lib/web3/config';
import { useSiwe } from '@/lib/web3/hooks';

const queryClient = new QueryClient();

/**
 * Bridge between `AuthContext` (which has no wagmi access) and wagmi
 * itself. Listens for the app-level `crm:auth-logout` event dispatched
 * by the `AuthProvider.logout()` flow and fully tears down the wallet
 * connection, closing H-02 (wallet remaining bound to the browser after
 * a user has explicitly signed out).
 *
 * Also runs the SIWE flow automatically on first connect when there is
 * no active SIWE session, so the session-to-wallet binding is
 * established without the user having to hunt for a "sign in" button.
 */
function WalletSessionSync() {
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { status, signIn } = useSiwe();
  const previousAddressRef = useRef<`0x${string}` | undefined>(undefined);
  const signedAddressRef = useRef<`0x${string}` | undefined>(undefined);

  // ── Disconnect on app logout ──────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      try {
        disconnect();
      } catch {
        // No-op: best-effort teardown.
      }
    };
    window.addEventListener('crm:auth-logout', handler);
    return () => window.removeEventListener('crm:auth-logout', handler);
  }, [disconnect]);

  // ── Auto-SIWE after wallet connection ─────────────────────────────
  // Prompt exactly once per newly-connected address. We intentionally
  // don't retry on failure — the user should see the error from the
  // wallet modal and decide whether to re-attempt.
  useEffect(() => {
    if (!isConnected || !address) {
      previousAddressRef.current = undefined;
      signedAddressRef.current = undefined;
      return;
    }
    if (previousAddressRef.current === address) return;
    previousAddressRef.current = address;
    if (signedAddressRef.current === address) return;
    if (status === 'signing' || status === 'verifying') return;

    signedAddressRef.current = address;
    signIn().catch(() => {
      // Allow a future reconnect to retry by clearing the remembered
      // address on failure.
      signedAddressRef.current = undefined;
    });
  }, [address, isConnected, status, signIn]);

  return null;
}

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: '#2563eb' })}>
          <WalletSessionSync />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
