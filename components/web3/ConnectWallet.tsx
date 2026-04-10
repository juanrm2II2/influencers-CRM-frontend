'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * Wallet connection button using RainbowKit.
 * Shows chain selector + account when connected.
 */
export default function ConnectWallet() {
  return (
    <ConnectButton
      showBalance={true}
      chainStatus="icon"
      accountStatus="address"
    />
  );
}
