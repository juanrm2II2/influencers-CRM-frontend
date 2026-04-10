import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/web3/hooks', () => ({
  useTokenSaleInfo: () => ({
    saleInfo: null,
    isLoading: false,
    error: new Error('Network error'),
  }),
  formatWei: (v: bigint) => v.toString(),
  formatTokenAmount: (v: bigint) => v.toString(),
}));

import SaleProgressDashboard from '../SaleProgressDashboard';

describe('SaleProgressDashboard', () => {
  it('shows error state when data fails to load', () => {
    render(<SaleProgressDashboard />);
    expect(screen.getByText('Failed to load sale data')).toBeInTheDocument();
  });
});

describe('SaleProgressDashboard - loading', () => {
  it('shows loading skeleton', async () => {
    vi.doMock('@/lib/web3/hooks', () => ({
      useTokenSaleInfo: () => ({
        saleInfo: null,
        isLoading: true,
        error: null,
      }),
      formatWei: (v: bigint) => v.toString(),
      formatTokenAmount: (v: bigint) => v.toString(),
    }));

    vi.resetModules();
    const { default: SaleProgressDashboardLoading } = await import('../SaleProgressDashboard');
    const { container } = render(<SaleProgressDashboardLoading />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
