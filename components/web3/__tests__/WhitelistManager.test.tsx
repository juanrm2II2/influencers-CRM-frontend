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

// Mock AuthContext – use a mutable ref so per-test overrides are possible
const defaultAuth = {
  user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' as const },
  isAuthenticated: true,
  isLoading: false,
  hasRole: (role: string) => role === 'admin',
  login: vi.fn(),
  logout: vi.fn(),
};

let mockAuth = { ...defaultAuth };

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockAuth,
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
  beforeEach(() => {
    mockAuth = { ...defaultAuth };
  });

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

  // F-02: access control tests
  it('shows loading indicator while role is being verified', () => {
    mockAuth = { ...defaultAuth, isLoading: true };
    render(<WhitelistManager />);
    expect(screen.getByText('Verifying permissions…')).toBeInTheDocument();
    expect(screen.queryByText('Whitelist Management')).not.toBeInTheDocument();
  });

  it('shows access denied for non-admin users', () => {
    mockAuth = {
      ...defaultAuth,
      user: { id: '2', email: 'viewer@test.com', name: 'Viewer', role: 'viewer' as const },
      hasRole: () => false,
    };
    render(<WhitelistManager />);
    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.queryByText('Whitelist Management')).not.toBeInTheDocument();
  });
});
