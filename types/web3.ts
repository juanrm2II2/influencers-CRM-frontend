/** Web3 & Token Sale types */

export interface TokenSaleInfo {
  /** Total tokens available for sale */
  totalTokens: bigint;
  /** Tokens already sold */
  tokensSold: bigint;
  /** Price per token in wei */
  tokenPrice: bigint;
  /** Hard cap in wei */
  hardCap: bigint;
  /** Soft cap in wei */
  softCap: bigint;
  /** Total wei raised */
  totalRaised: bigint;
  /** Sale start timestamp (seconds) */
  startTime: number;
  /** Sale end timestamp (seconds) */
  endTime: number;
  /** Whether the sale is currently active */
  isActive: boolean;
  /** Whether the sale is paused */
  isPaused: boolean;
}

export interface VestingSchedule {
  /** Total tokens allocated to this beneficiary */
  totalAmount: bigint;
  /** Tokens already released */
  releasedAmount: bigint;
  /** Vesting start timestamp (seconds) */
  startTime: number;
  /** Cliff duration in seconds */
  cliffDuration: number;
  /** Total vesting duration in seconds */
  vestingDuration: number;
  /** Whether the schedule is revocable */
  revocable: boolean;
  /** Whether the schedule has been revoked */
  revoked: boolean;
}

export interface ContributionRecord {
  /** Contributor wallet address */
  contributor: `0x${string}`;
  /** Amount contributed in wei */
  amount: bigint;
  /** Tokens purchased */
  tokenAmount: bigint;
  /** Transaction hash */
  txHash: `0x${string}`;
  /** Block timestamp */
  timestamp: number;
}

export interface WhitelistEntry {
  /** Wallet address */
  address: `0x${string}`;
  /** Maximum allowed contribution in wei */
  maxContribution: bigint;
  /** Whether currently whitelisted */
  isWhitelisted: boolean;
}

export type TransactionStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'failed';

export interface TransactionState {
  status: TransactionStatus;
  hash?: `0x${string}`;
  error?: string;
  receipt?: {
    transactionHash: `0x${string}`;
    blockNumber: bigint;
    gasUsed: bigint;
    status: 'success' | 'reverted';
  };
}

export interface SupportedChain {
  id: number;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
