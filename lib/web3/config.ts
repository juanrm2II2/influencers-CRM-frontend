import { http } from 'wagmi';
import { mainnet, polygon, arbitrum, base, sepolia } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

/**
 * Supported chains – production networks + Sepolia for testing.
 * The first chain is the default.
 */
export const supportedChains = [mainnet, polygon, arbitrum, base, sepolia] as const;

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
