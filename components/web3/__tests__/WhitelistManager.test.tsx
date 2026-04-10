import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x1234567890123456789012345678901234567890', isConnected: true }),
  useReadContract: () => ({ data: undefined, isLoading: false, error: null, refetch: vi.fn() }),
  useWriteContract: () => ({ writeContractAsync: vi.fn() }),
  useWaitForTransactionReceipt: () => ({ data: undefined }),
}));

// Mock AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    hasRole: (role: string) => role === 'admin',
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock the hooks
vi.mock('@/lib/web3/hooks', () => ({
  useWhitelistManagement: () => ({
    txState: { status: 'idle' },
    addToWhitelist: vi.fn(),
    removeFromWhitelist: vi.fn(),
    reset: vi.fn(),
  }),
}));

import WhitelistManager from '../WhitelistManager';

describe('WhitelistManager', () => {
  it('renders the form for admin users', () => {
    render(<WhitelistManager />);
    expect(screen.getByText('Whitelist Management')).toBeInTheDocument();
    expect(screen.getByText('Add addresses')).toBeInTheDocument();
    expect(screen.getByText('Remove addresses')).toBeInTheDocument();
  });

  it('shows add mode by default', () => {
    render(<WhitelistManager />);
    expect(
      screen.getByLabelText(/Enter addresses and max contribution/)
    ).toBeInTheDocument();
  });

  it('switches to remove mode', async () => {
    const user = userEvent.setup();
    render(<WhitelistManager />);
    await user.click(screen.getByText('Remove addresses'));
    expect(
      screen.getByLabelText(/Enter addresses to remove/)
    ).toBeInTheDocument();
  });

  it('disables submit when input is empty', () => {
    render(<WhitelistManager />);
    const submitBtn = screen.getByRole('button', { name: 'Add to whitelist' });
    expect(submitBtn).toBeDisabled();
  });

  it('shows validation errors for invalid addresses in add mode', async () => {
    const user = userEvent.setup();
    render(<WhitelistManager />);
    const textarea = screen.getByLabelText(/Enter addresses and max contribution/);
    await user.type(textarea, 'not-an-address, 10');
    const submitBtn = screen.getByRole('button', { name: 'Add to whitelist' });
    await user.click(submitBtn);
    expect(screen.getByText(/invalid address/)).toBeInTheDocument();
  });

  it('shows validation errors for missing amount in add mode', async () => {
    const user = userEvent.setup();
    render(<WhitelistManager />);
    const textarea = screen.getByLabelText(/Enter addresses and max contribution/);
    await user.type(textarea, '0x1234567890123456789012345678901234567890');
    const submitBtn = screen.getByRole('button', { name: 'Add to whitelist' });
    await user.click(submitBtn);
    expect(screen.getByText(/expected "address, maxETH"/)).toBeInTheDocument();
  });
});
