import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataExportPage from '../../app/data-export/page';
import * as api from '@/lib/api';
import type { Influencer } from '@/types';

vi.mock('@/lib/api');
vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

const mockUseAuth = vi.fn();
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockInfluencer: Influencer = {
  id: '1',
  handle: 'testhandle',
  platform: 'instagram',
  full_name: 'Test User',
  bio: 'Test bio',
  followers: 10000,
  following: 500,
  avg_likes: 1000,
  avg_views: 5000,
  engagement_rate: 5.5,
  profile_pic_url: 'https://example.com/pic.jpg',
  profile_url: 'https://instagram.com/testhandle',
  niche: 'tech',
  status: 'active',
  notes: 'Great influencer',
  last_scraped: '2026-01-01',
  created_at: '2026-01-01',
};

describe('DataExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL.createObjectURL / revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:test');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('shows login message when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
    });

    render(<DataExportPage />);

    expect(screen.getByText('Please log in to export your data.')).toBeInTheDocument();
  });

  it('renders export page when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
    });

    render(<DataExportPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Export Your Data' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download JSON' })).toBeInTheDocument();
  });

  it('exports CSV data', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
    });
    vi.mocked(api.getInfluencers).mockResolvedValueOnce([mockInfluencer]);

    const user = userEvent.setup();
    render(<DataExportPage />);

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    await waitFor(() => {
      expect(screen.getByText(/Data exported successfully as CSV/)).toBeInTheDocument();
    });
  });

  it('exports JSON data', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
    });
    vi.mocked(api.getInfluencers).mockResolvedValueOnce([mockInfluencer]);

    const user = userEvent.setup();
    render(<DataExportPage />);

    await user.click(screen.getByRole('button', { name: 'Download JSON' }));

    await waitFor(() => {
      expect(screen.getByText(/Data exported successfully as JSON/)).toBeInTheDocument();
    });
  });

  it('shows error on export failure', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: '1', email: 'test@test.com', name: 'Test', role: 'admin' },
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(),
    });
    vi.mocked(api.getInfluencers).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<DataExportPage />);

    await user.click(screen.getByRole('button', { name: 'Download CSV' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to export data. Please try again.')).toBeInTheDocument();
    });
  });
});
