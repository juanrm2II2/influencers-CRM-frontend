import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: undefined, isConnected: false }),
}));

vi.mock('@/lib/web3/hooks', () => ({
  useKycVerification: () => ({
    verification: { status: 'none' },
    isVerified: false,
    isLoading: false,
    error: null,
    fetchStatus: vi.fn(),
    requestToken: vi.fn(),
  }),
}));

import KycVerificationBanner from '../KycVerificationBanner';

describe('KycVerificationBanner', () => {
  it('renders nothing when wallet is not connected', () => {
    const { container } = render(<KycVerificationBanner />);
    expect(container.innerHTML).toBe('');
  });
});

describe('KycVerificationBanner - connected', () => {
  it('shows loading state', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useKycVerification: () => ({
        verification: { status: 'none' },
        isVerified: false,
        isLoading: true,
        error: null,
        fetchStatus: vi.fn(),
        requestToken: vi.fn(),
      }),
    }));

    const { default: Banner } = await import('../KycVerificationBanner');
    render(<Banner />);
    expect(screen.getByText('Loading KYC status…')).toBeInTheDocument();
  });

  it('shows error state with retry button', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useKycVerification: () => ({
        verification: { status: 'none' },
        isVerified: false,
        isLoading: false,
        error: 'Network error',
        fetchStatus: vi.fn(),
        requestToken: vi.fn(),
      }),
    }));

    const { default: Banner } = await import('../KycVerificationBanner');
    render(<Banner />);
    expect(screen.getByText('Unable to load KYC status')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('shows "Not Started" status with Start Verification button', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useKycVerification: () => ({
        verification: { status: 'none' },
        isVerified: false,
        isLoading: false,
        error: null,
        fetchStatus: vi.fn(),
        requestToken: vi.fn(),
      }),
    }));

    const { default: Banner } = await import('../KycVerificationBanner');
    render(<Banner />);
    expect(screen.getByTestId('kyc-status')).toHaveTextContent('Not Started');
    expect(screen.getByText('Start Verification')).toBeInTheDocument();
  });

  it('shows "Under Review" status with spinner', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useKycVerification: () => ({
        verification: { status: 'pending' },
        isVerified: false,
        isLoading: false,
        error: null,
        fetchStatus: vi.fn(),
        requestToken: vi.fn(),
      }),
    }));

    const { default: Banner } = await import('../KycVerificationBanner');
    render(<Banner />);
    expect(screen.getByTestId('kyc-status')).toHaveTextContent('Under Review');
    expect(screen.getByText('Verification in progress…')).toBeInTheDocument();
  });

  it('shows "Verified" status when approved', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useKycVerification: () => ({
        verification: { status: 'approved', expiresAt: '2027-01-01T00:00:00Z' },
        isVerified: true,
        isLoading: false,
        error: null,
        fetchStatus: vi.fn(),
        requestToken: vi.fn(),
      }),
    }));

    const { default: Banner } = await import('../KycVerificationBanner');
    render(<Banner />);
    expect(screen.getByTestId('kyc-status')).toHaveTextContent('Verified');
    // Should not show a Start/Re-verify button
    expect(screen.queryByText('Start Verification')).not.toBeInTheDocument();
    expect(screen.queryByText('Re-verify')).not.toBeInTheDocument();
  });

  it('shows "Rejected" status with reason and Re-verify button', async () => {
    vi.doMock('wagmi', () => ({
      useAccount: () => ({
        address: '0x1234567890123456789012345678901234567890',
        isConnected: true,
      }),
    }));

    vi.resetModules();
    vi.doMock('@/lib/web3/hooks', () => ({
      useKycVerification: () => ({
        verification: { status: 'rejected', rejectionReason: 'Document unclear' },
        isVerified: false,
        isLoading: false,
        error: null,
        fetchStatus: vi.fn(),
        requestToken: vi.fn(),
      }),
    }));

    const { default: Banner } = await import('../KycVerificationBanner');
    render(<Banner />);
    expect(screen.getByTestId('kyc-status')).toHaveTextContent('Rejected');
    expect(screen.getByText('Reason: Document unclear')).toBeInTheDocument();
    expect(screen.getByText('Re-verify')).toBeInTheDocument();
  });
});
