/**
 * Block-explorer URL helper for transaction hashes.
 *
 * Lives in its own module (no wagmi runtime dependency, only
 * `wagmi/chains` for the chain-ID constants) so it can be safely
 * imported by leaf components like `TransactionReceipt` without
 * pulling the entire wagmi/RainbowKit setup into the bundle of every
 * importer — and so unit tests for those components do not have to
 * mock the wagmi `http` transport just to render a `<a>` element
 * (audit L-02).
 */
import { mainnet, polygon, arbitrum, base, sepolia } from 'wagmi/chains';

/**
 * Map a chain ID to its canonical block-explorer base URL. Unknown
 * chains intentionally have no entry so the helper returns `null`,
 * letting the UI hide the link rather than pointing users at the wrong
 * network's explorer.
 */
const CHAIN_EXPLORERS: Record<number, string> = {
  [mainnet.id]: 'https://etherscan.io',
  [polygon.id]: 'https://polygonscan.com',
  [arbitrum.id]: 'https://arbiscan.io',
  [base.id]: 'https://basescan.org',
  [sepolia.id]: 'https://sepolia.etherscan.io',
};

/**
 * Resolve the default chain ID. Mirrors the validation done in
 * `lib/web3/config.ts` but inlined so this module has zero wagmi
 * runtime dependencies. Malformed values fall back to mainnet, but a
 * well-formed integer that simply doesn't have an explorer entry is
 * preserved as-is so {@link explorerTxUrl} returns `null` and the UI
 * hides the link instead of pointing the user at the wrong network's
 * explorer.
 */
function resolveDefaultChainId(): number {
  const raw = process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID;
  if (!raw) return mainnet.id;
  const parsed = parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return mainnet.id;
  return parsed;
}

const DEFAULT_CHAIN_ID = resolveDefaultChainId();

/**
 * Build a transaction-detail URL on the explorer matching `chainId`.
 * Returns `null` when the chain has no known explorer so the UI can
 * hide the link instead of mis-routing the user.
 */
export function explorerTxUrl(
  hash: `0x${string}`,
  chainId: number = DEFAULT_CHAIN_ID,
): string | null {
  const baseUrl = CHAIN_EXPLORERS[chainId];
  if (!baseUrl) return null;
  return `${baseUrl}/tx/${hash}`;
}
