import { describe, it, expect } from 'vitest';
import type {
  TokenSaleInfo,
  VestingSchedule,
  ContributionRecord,
  WhitelistEntry,
  TransactionState,
  SupportedChain,
} from '../web3';

describe('Web3 types', () => {
  it('TokenSaleInfo shape is correct', () => {
    const info: TokenSaleInfo = {
      totalTokens: 1000000n,
      tokensSold: 500000n,
      tokenPrice: 100n,
      hardCap: 1000000000000000000n,
      softCap: 500000000000000000n,
      totalRaised: 750000000000000000n,
      startTime: 1700000000,
      endTime: 1700086400,
      isActive: true,
      isPaused: false,
    };
    expect(info.isActive).toBe(true);
    expect(info.totalTokens).toBe(1000000n);
  });

  it('VestingSchedule shape is correct', () => {
    const schedule: VestingSchedule = {
      totalAmount: 1000n,
      releasedAmount: 250n,
      startTime: 1700000000,
      cliffDuration: 86400,
      vestingDuration: 365 * 86400,
      revocable: true,
      revoked: false,
    };
    expect(schedule.vestingDuration).toBe(365 * 86400);
  });

  it('ContributionRecord shape is correct', () => {
    const record: ContributionRecord = {
      contributor: '0x1234567890123456789012345678901234567890',
      amount: 1000000000000000000n,
      tokenAmount: 10000n,
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      timestamp: 1700000000,
    };
    expect(record.contributor).toMatch(/^0x/);
  });

  it('WhitelistEntry shape is correct', () => {
    const entry: WhitelistEntry = {
      address: '0x1234567890123456789012345678901234567890',
      maxContribution: 5000000000000000000n,
      isWhitelisted: true,
    };
    expect(entry.isWhitelisted).toBe(true);
  });

  it('TransactionState covers all statuses', () => {
    const states: TransactionState[] = [
      { status: 'idle' },
      { status: 'pending' },
      { status: 'confirming', hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
      {
        status: 'confirmed',
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        receipt: {
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 123n,
          gasUsed: 21000n,
          status: 'success',
        },
      },
      { status: 'failed', error: 'User rejected' },
    ];
    expect(states).toHaveLength(5);
  });

  it('SupportedChain shape is correct', () => {
    const chain: SupportedChain = {
      id: 1,
      name: 'Ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    };
    expect(chain.id).toBe(1);
  });
});
