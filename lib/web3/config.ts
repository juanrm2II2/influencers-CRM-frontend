import { http } from 'wagmi';
import { mainnet, polygon, arbitrum, base, sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

/**
 * Supported chains – production networks + Sepolia for testing.
 * The first chain is the default.
 */
export const supportedChains = [mainnet, polygon, arbitrum, base, sepolia] as const;

/**
 * The chain ID that the deployed contracts live on.
 * Every write transaction MUST target this chain; hooks will prompt the
 * user to switch if their wallet is on a different network.
 *
 * Defaults to Ethereum mainnet (1) when the env var is not set.
 */
export const EXPECTED_CHAIN_ID: number = (() => {
  const raw = process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID;
  if (raw) {
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return mainnet.id;
})();

/**
 * Wagmi + RainbowKit configuration.
 *
 * Environment variables:
 *  - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID  – WalletConnect Cloud project ID
 *  - NEXT_PUBLIC_CHAIN_RPC_URL_*           – optional per-chain RPC overrides
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Influencer CRM – Token Sale',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: supportedChains,
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_CHAIN_RPC_URL_MAINNET),
    [polygon.id]: http(process.env.NEXT_PUBLIC_CHAIN_RPC_URL_POLYGON),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_CHAIN_RPC_URL_ARBITRUM),
    [base.id]: http(process.env.NEXT_PUBLIC_CHAIN_RPC_URL_BASE),
    [sepolia.id]: http(process.env.NEXT_PUBLIC_CHAIN_RPC_URL_SEPOLIA),
  },
  ssr: true,
});
