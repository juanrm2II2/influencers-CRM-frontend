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
 * Defaults to Ethereum mainnet (1) when the env var is not set. The env
 * var, when supplied, must match one of {@link supportedChains} — an
 * unknown chain ID is treated as a configuration error and causes the
 * module to throw at load time. This closes a foot-gun where a typo in
 * `NEXT_PUBLIC_EXPECTED_CHAIN_ID` would have silently pointed every
 * write transaction + SIWE message at a chain the app doesn't support.
 */
const SUPPORTED_CHAIN_IDS: ReadonlySet<number> = new Set(
  supportedChains.map((c) => c.id),
);

export const EXPECTED_CHAIN_ID: number = (() => {
  const raw = process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID;
  if (raw === undefined || raw === '') return mainnet.id;
  const parsed = parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== raw.trim()) {
    // Any non-integer / non-positive / non-canonical value (e.g. "1.5",
    // "not-a-number", "-1") falls back to mainnet rather than producing
    // a surprise chain binding.
    return mainnet.id;
  }
  if (!SUPPORTED_CHAIN_IDS.has(parsed)) {
    const allowed = [...SUPPORTED_CHAIN_IDS].join(', ');
    throw new Error(
      `NEXT_PUBLIC_EXPECTED_CHAIN_ID=${parsed} is not in the supported-chain ` +
        `allow-list [${allowed}]. Configure a chain that is present in ` +
        `\`supportedChains\` or add support for it explicitly.`,
    );
  }
  return parsed;
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
