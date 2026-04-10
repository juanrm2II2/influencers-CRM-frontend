import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock wagmi
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
}));

vi.mock('@/lib/web3/hooks', () => ({
  useVestingSchedule: () => ({
    schedule: null,
    isLoading: false,
    error: null,
  }),
  useReleasableAmount: () => ({
    releasable: 0n,
    isLoading: false,
  }),
  useClaimVestedTokens: () => ({
    txState: { status: 'idle' },
    claim: vi.fn(),
    reset: vi.fn(),
  }),
  formatTokenAmount: (v: bigint) => v.toString(),
}));

import VestingSchedule from '../VestingSchedule';

describe('VestingSchedule', () => {
  it('shows connect wallet message when not connected', () => {
    render(<VestingSchedule />);
    expect(
      screen.getByText('Connect your wallet to view your vesting schedule')
    ).toBeInTheDocument();
  });
});
