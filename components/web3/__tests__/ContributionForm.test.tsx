import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
}));

vi.mock('@/lib/web3/hooks', () => ({
  useContribute: () => ({
    txState: { status: 'idle' },
    contribute: vi.fn(),
    reset: vi.fn(),
  }),
  useTokenSaleInfo: () => ({
    saleInfo: null,
    isLoading: false,
    error: null,
  }),
  useWhitelistStatus: () => ({
    isWhitelisted: false,
    maxContribution: 0n,
    isLoading: false,
  }),
  useUserContribution: () => ({
    contribution: 0n,
    isLoading: false,
  }),
  formatWei: (v: bigint) => v.toString(),
}));

import ContributionForm from '../ContributionForm';

describe('ContributionForm', () => {
  it('shows connect wallet message when not connected', () => {
    render(<ContributionForm />);
    expect(screen.getByText('Connect your wallet to contribute')).toBeInTheDocument();
  });
});

describe('ContributionForm - connected', () => {
  it('shows the form when connected', async () => {
    // Re-mock wagmi for connected state
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    // Re-import to get the new mocks
    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useContribute: () => ({
        txState: { status: 'idle' },
        contribute: vi.fn(),
        reset: vi.fn(),
      }),
      useTokenSaleInfo: () => ({
        saleInfo: {
          totalTokens: 1000000n,
          tokensSold: 0n,
          tokenPrice: 100n,
          hardCap: 1000n,
          softCap: 500n,
          totalRaised: 0n,
          startTime: 0,
          endTime: 0,
          isActive: true,
          isPaused: false,
        },
        isLoading: false,
        error: null,
      }),
      useWhitelistStatus: () => ({
        isWhitelisted: true,
        maxContribution: 1000n,
        isLoading: false,
      }),
      useUserContribution: () => ({
        contribution: 0n,
        isLoading: false,
      }),
      formatWei: (v: bigint) => v.toString(),
    }));

    const { default: ContributionFormConnected } = await import('../ContributionForm');
    render(<ContributionFormConnected />);
    expect(screen.getByText('Contribute to Token Sale')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount (ETH)')).toBeInTheDocument();
    expect(screen.getByText('Contribute')).toBeInTheDocument();
  });
});
