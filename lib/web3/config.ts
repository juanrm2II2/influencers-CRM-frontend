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
    const parsed = parseInt(raw, 10);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return mainnet.id;
})();

/**
 * Read the WalletConnect Cloud project ID from the environment, failing loudly
 * at startup if it isn't configured. RainbowKit/WalletConnect require a valid
 * ID at runtime, so trusting a non-null assertion or silently falling back to
 * an empty string would only defer the error to an opaque runtime failure.
 */
function getWalletConnectProjectId(): string {
  const id = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!id || id.trim().length === 0) {
    throw new Error(
      'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
        'Create a project at https://cloud.walletconnect.com and configure the env var.',
    );
  }
  return id;
}

/**
 * Wagmi + RainbowKit configuration.
 *
 * Environment variables:
 *  - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID  – WalletConnect Cloud project ID (required)
 *  - NEXT_PUBLIC_CHAIN_RPC_URL_*           – optional per-chain RPC overrides
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'Influencer CRM – Token Sale',
  projectId: getWalletConnectProjectId(),
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
