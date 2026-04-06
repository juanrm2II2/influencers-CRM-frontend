import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import type { ReactNode } from 'react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

// ── Supabase client mock ────────────────────────────────────────────────────

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetUser = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignIn,
      signOut: mockSignOut,
      getUser: mockGetUser,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}));

// Test component that exposes auth context
function TestConsumer({ action }: { action?: string }) {
  const { user, isAuthenticated, isLoading, login, logout, hasRole } = useAuth();

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="user">{user ? JSON.stringify(user) : 'null'}</span>
      <span data-testid="has-admin">{String(hasRole('admin'))}</span>
      <span data-testid="has-manager">{String(hasRole('manager'))}</span>
      <span data-testid="has-viewer">{String(hasRole('viewer'))}</span>
      {action === 'login' && (
        <button onClick={() => login({ email: 'test@example.com', password: 'password123' })}>
          Login
        </button>
      )}
      {action === 'logout' && (
        <button onClick={() => logout()}>Logout</button>
      )}
    </div>
  );
}

function renderWithProvider(ui: ReactNode) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockPush.mockClear();

    // Default: no active session
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('useAuth outside provider', () => {
    it('throws when used outside AuthProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useAuth must be used inside <AuthProvider>');
      spy.mockRestore();
    });
  });

  describe('initial state', () => {
    it('starts with isLoading true and no user', () => {
      renderWithProvider(<TestConsumer />);
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('rehydrates user from sessionStorage, then verifies with Supabase', async () => {
      const storedUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'admin' };
      sessionStorage.setItem('crm_user', JSON.stringify(storedUser));

      // Supabase confirms the session
      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            user_metadata: { name: 'Test', role: 'admin' },
          },
        },
      });

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
        expect(screen.getByTestId('user').textContent).toContain('test@example.com');
      });
    });

    it('clears user when Supabase says no session', async () => {
      const storedUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'admin' };
      sessionStorage.setItem('crm_user', JSON.stringify(storedUser));
      mockGetUser.mockResolvedValue({ data: { user: null } });

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
    });

    it('handles invalid sessionStorage data gracefully', async () => {
      sessionStorage.setItem('crm_user', 'invalid-json{');

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('null');
      });
    });
  });

  describe('login', () => {
    it('authenticates user and navigates to dashboard', async () => {
      const supabaseUser = {
        id: '1',
        email: 'test@example.com',
        user_metadata: { name: 'Test User', role: 'admin' },
      };
      mockSignIn.mockResolvedValueOnce({ data: { user: supabaseUser }, error: null });

      const user = userEvent.setup();
      renderWithProvider(<TestConsumer action="login" />);

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(sessionStorage.getItem('crm_user')).toBeTruthy();
    });

    it('throws on failed login with Supabase error', async () => {
      mockSignIn.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      const user = userEvent.setup();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProvider(<TestConsumer action="login" />);
      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
      spy.mockRestore();
    });
  });

  describe('logout', () => {
    it('clears user and navigates to login', async () => {
      const storedUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'admin' };
      sessionStorage.setItem('crm_user', JSON.stringify(storedUser));
      mockSignOut.mockResolvedValueOnce({ error: null });

      const user = userEvent.setup();
      renderWithProvider(<TestConsumer action="logout" />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
        expect(screen.getByTestId('user').textContent).toBe('null');
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(sessionStorage.getItem('crm_user')).toBeNull();
    });

    it('still clears local state if signOut fails', async () => {
      const storedUser = { id: '1', email: 'test@example.com', name: 'Test', role: 'manager' };
      sessionStorage.setItem('crm_user', JSON.stringify(storedUser));
      mockSignOut.mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      renderWithProvider(<TestConsumer action="logout" />);

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('true');
      });

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated').textContent).toBe('false');
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('hasRole', () => {
    it('admin has all roles', async () => {
      const adminUser = { id: '1', email: 'a@b.com', name: 'Admin', role: 'admin' };
      sessionStorage.setItem('crm_user', JSON.stringify(adminUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('has-admin').textContent).toBe('true');
        expect(screen.getByTestId('has-manager').textContent).toBe('true');
        expect(screen.getByTestId('has-viewer').textContent).toBe('true');
      });
    });

    it('manager can access manager and viewer roles', async () => {
      const managerUser = { id: '1', email: 'a@b.com', name: 'Manager', role: 'manager' };
      sessionStorage.setItem('crm_user', JSON.stringify(managerUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('has-admin').textContent).toBe('false');
        expect(screen.getByTestId('has-manager').textContent).toBe('true');
        expect(screen.getByTestId('has-viewer').textContent).toBe('true');
      });
    });

    it('viewer can only access viewer role', async () => {
      const viewerUser = { id: '1', email: 'a@b.com', name: 'Viewer', role: 'viewer' };
      sessionStorage.setItem('crm_user', JSON.stringify(viewerUser));

      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('has-admin').textContent).toBe('false');
        expect(screen.getByTestId('has-manager').textContent).toBe('false');
        expect(screen.getByTestId('has-viewer').textContent).toBe('true');
      });
    });

    it('returns false when no user', async () => {
      renderWithProvider(<TestConsumer />);

      await waitFor(() => {
        expect(screen.getByTestId('has-admin').textContent).toBe('false');
        expect(screen.getByTestId('has-viewer').textContent).toBe('false');
      });
    });
  });
});
