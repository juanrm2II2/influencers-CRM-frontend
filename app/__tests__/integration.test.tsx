import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as api from '@/lib/api';
import type { Influencer } from '@/types';

// ─── Integration tests: Auth flow + CRUD operations ────────────────────────

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  getInfluencers: vi.fn(),
  getInfluencer: vi.fn(),
  searchInfluencer: vi.fn(),
  updateInfluencer: vi.fn(),
  deleteInfluencer: vi.fn(),
  logOutreach: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockInfluencer: Influencer = {
  id: '1',
  handle: 'testuser',
  platform: 'instagram',
  full_name: 'Test User',
  bio: 'Bio',
  followers: 10000,
  following: 500,
  avg_likes: 1000,
  avg_views: 5000,
  engagement_rate: 5.0,
  profile_pic_url: '',
  profile_url: '',
  niche: 'tech',
  status: 'prospect',
  notes: '',
  last_scraped: '2024-01-01',
  created_at: '2024-01-01',
};

// Component that simulates the full auth + CRUD flow
function AuthCRUDTestApp() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  async function handleLogin() {
    try {
      await login({ email: 'test@example.com', password: 'password' });
    } catch {
      // Expected in failure tests – swallow to prevent unhandled rejection
    }
  }

  async function handleCrudOps() {
    await api.getInfluencers();
    await api.searchInfluencer('newuser', 'instagram');
    await api.updateInfluencer('1', { status: 'contacted' });
    await api.deleteInfluencer('1');
  }

  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="user-name">{user?.name ?? 'none'}</span>
      <button data-testid="login-btn" onClick={handleLogin}>Login</button>
      <button data-testid="logout-btn" onClick={() => logout()}>Logout</button>
      <button data-testid="crud-btn" onClick={handleCrudOps}>CRUD</button>
    </div>
  );
}

describe('Integration: Auth flow + CRUD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('complete auth flow: login → CRUD operations → logout', async () => {
    const userObj = { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin' };

    // Mock session verify (mount effect) – no active session
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    // Mock successful login
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: userObj }),
    });

    // Mock CRUD operations
    vi.mocked(api.getInfluencers).mockResolvedValueOnce([mockInfluencer]);
    vi.mocked(api.searchInfluencer).mockResolvedValueOnce(mockInfluencer);
    vi.mocked(api.updateInfluencer).mockResolvedValueOnce({ ...mockInfluencer, status: 'contacted' });
    vi.mocked(api.deleteInfluencer).mockResolvedValueOnce(undefined);

    // Mock logout
    mockFetch.mockResolvedValueOnce({ ok: true });

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthCRUDTestApp />
      </AuthProvider>,
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authed').textContent).toBe('false');

    // Step 1: Login
    await user.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authed').textContent).toBe('true');
      expect(screen.getByTestId('user-name').textContent).toBe('Test User');
    });
    expect(mockPush).toHaveBeenCalledWith('/dashboard');

    // Verify user is persisted in sessionStorage
    expect(sessionStorage.getItem('crm_user')).toBeTruthy();

    // Step 2: Perform CRUD operations
    await user.click(screen.getByTestId('crud-btn'));

    await waitFor(() => {
      expect(api.getInfluencers).toHaveBeenCalled();
      expect(api.searchInfluencer).toHaveBeenCalledWith('newuser', 'instagram');
      expect(api.updateInfluencer).toHaveBeenCalledWith('1', { status: 'contacted' });
      expect(api.deleteInfluencer).toHaveBeenCalledWith('1');
    });

    // Step 3: Logout
    await user.click(screen.getByTestId('logout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authed').textContent).toBe('false');
      expect(screen.getByTestId('user-name').textContent).toBe('none');
    });
    expect(mockPush).toHaveBeenCalledWith('/login');
    expect(sessionStorage.getItem('crm_user')).toBeNull();
  });

  it('login failure does not authenticate user', async () => {
    // Mock session verify (mount effect) – no active session
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Bad credentials' }),
    });

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthCRUDTestApp />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    await user.click(screen.getByTestId('login-btn'));

    // Wait a tick for the rejected promise
    await waitFor(() => {
      expect(screen.getByTestId('authed').textContent).toBe('false');
    });
    expect(sessionStorage.getItem('crm_user')).toBeNull();
    spy.mockRestore();
  });

  it('session rehydration: user persists across re-renders', async () => {
    const userObj = { id: '1', email: 'test@example.com', name: 'Rehydrated User', role: 'manager' };
    sessionStorage.setItem('crm_user', JSON.stringify(userObj));

    render(
      <AuthProvider>
        <AuthCRUDTestApp />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authed').textContent).toBe('true');
      expect(screen.getByTestId('user-name').textContent).toBe('Rehydrated User');
    });
  });
});
