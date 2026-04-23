/**
 * Smart contract ABIs and deployment addresses.
 *
 * Addresses are loaded from environment variables so each deployment
 * (testnet / mainnet) can point at the correct contracts without
 * rebuilding.
 */

// ─── Token Sale ABI ──────────────────────────────────────────────────────────

export const TOKEN_SALE_ABI = [
  // Read
  {
    name: 'saleInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalTokens', type: 'uint256' },
      { name: 'tokensSold', type: 'uint256' },
      { name: 'tokenPrice', type: 'uint256' },
      { name: 'hardCap', type: 'uint256' },
      { name: 'softCap', type: 'uint256' },
      { name: 'totalRaised', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'isActive', type: 'bool' },
      { name: 'isPaused', type: 'bool' },
    ],
  },
  {
    name: 'contributions',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'contributor', type: 'address' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
  },
  {
    name: 'isWhitelisted',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'whitelistAllocation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Write
  {
    name: 'contribute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'addToWhitelist',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'accounts', type: 'address[]' },
      { name: 'maxContributions', type: 'uint256[]' },
    ],
    outputs: [],
  },
  {
    name: 'removeFromWhitelist',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'accounts', type: 'address[]' }],
    outputs: [],
  },
  // Events
  {
    name: 'Contribution',
    type: 'event',
    inputs: [
      { name: 'contributor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'tokenAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'WhitelistUpdated',
    type: 'event',
    inputs: [
      { name: 'account', type: 'address', indexed: true },
      { name: 'status', type: 'bool', indexed: false },
    ],
  },
] as const;

// ─── Vesting ABI ─────────────────────────────────────────────────────────────

export const VESTING_ABI = [
  // Read
  {
    name: 'getVestingSchedule',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'beneficiary', type: 'address' }],
    outputs: [
      { name: 'totalAmount', type: 'uint256' },
      { name: 'releasedAmount', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'cliffDuration', type: 'uint256' },
      { name: 'vestingDuration', type: 'uint256' },
      { name: 'revocable', type: 'bool' },
      { name: 'revoked', type: 'bool' },
    ],
  },
  {
    name: 'releasableAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Write
  {
    name: 'release',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // Events
  {
    name: 'TokensReleased',
    type: 'event',
    inputs: [
      { name: 'beneficiary', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

// ─── Contract addresses (per-chain) ──────────────────────────────────────────

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

function envAddress(key: string): `0x${string}` {
  const raw = process.env[key] ?? '';
  if (/^0x[0-9a-fA-F]{40}$/.test(raw)) return raw as `0x${string}`;
  // In production the build pipeline is expected to supply these; in tests
  // and local dev we fall back to the zero address so module import does not
  // throw. Contract write hooks (see lib/web3/hooks.ts `assertContractConfigured`)
  // guard against the zero address before sending txs so users cannot
  // accidentally send funds to 0x0 when a deployment is misconfigured.
  if (process.env.NODE_ENV !== 'test') {
    if (raw === '') {
      console.warn(`[web3] ${key} is not set; falling back to zero address. Contract writes will be blocked.`);
    } else {
      console.warn(`[web3] ${key} is not a valid 0x-prefixed address: "${raw}"; falling back to zero address.`);
    }
  }
  return ZERO_ADDRESS;
}

export const CONTRACT_ADDRESSES = {
  tokenSale: envAddress('NEXT_PUBLIC_TOKEN_SALE_ADDRESS'),
  vesting: envAddress('NEXT_PUBLIC_VESTING_ADDRESS'),
} as const;
