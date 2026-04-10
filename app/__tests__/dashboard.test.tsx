import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../../app/dashboard/page';
import * as api from '@/lib/api';
import type { Influencer } from '@/types';

vi.mock('@/lib/api', () => ({
  getInfluencers: vi.fn(),
  searchInfluencer: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin User', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

const mockInfluencers: Influencer[] = [
  {
    id: '1',
    handle: 'user1',
    platform: 'instagram',
    full_name: 'User One',
    bio: 'Bio 1',
    followers: 50000,
    following: 500,
    avg_likes: 2000,
    avg_views: 5000,
    engagement_rate: 4.0,
    profile_pic_url: 'https://example.com/1.jpg',
    profile_url: 'https://instagram.com/user1',
    niche: 'tech',
    status: 'active',
    notes: '',
    last_scraped: '2024-01-01',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    handle: 'user2',
    platform: 'tiktok',
    full_name: 'User Two',
    bio: 'Bio 2',
    followers: 1200000,
    following: 300,
    avg_likes: 50000,
    avg_views: 200000,
    engagement_rate: 6.5,
    profile_pic_url: 'https://example.com/2.jpg',
    profile_url: 'https://tiktok.com/@user2',
    niche: 'fashion',
    status: 'prospect',
    notes: '',
    last_scraped: '2024-01-02',
    created_at: '2024-01-02',
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(api.getInfluencers).mockImplementation(
      () => new Promise(() => {}), // never resolves
    );

    render(<DashboardPage />);

    // Should show a spinner (svg)
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders influencer cards after loading', async () => {
    vi.mocked(api.getInfluencers).mockResolvedValueOnce(mockInfluencers);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
    });
  });

  it('shows stats bar with correct values', async () => {
    vi.mocked(api.getInfluencers).mockResolvedValueOnce(mockInfluencers);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Influencers')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Active Partnerships')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(api.getInfluencers).mockRejectedValueOnce(new Error('Network error'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to load influencers. Make sure the backend is running.'),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('retry button re-fetches data', async () => {
    vi.mocked(api.getInfluencers)
      .mockRejectedValueOnce(new Error('err'))
      .mockResolvedValueOnce(mockInfluencers);

    const user = userEvent.setup();
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Try again'));

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
    });
  });

  it('shows empty state when no influencers', async () => {
    vi.mocked(api.getInfluencers).mockResolvedValueOnce([]);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No influencers found')).toBeInTheDocument();
    });
  });

  it('opens Add Influencer modal', async () => {
    vi.mocked(api.getInfluencers).mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No influencers found')).toBeInTheDocument();
    });

    // Click the header button
    const addButtons = screen.getAllByText('+ Add Influencer');
    await user.click(addButtons[0]);

    expect(screen.getByText('Handle')).toBeInTheDocument();
  });

  it('filters influencers by search text', async () => {
    vi.mocked(api.getInfluencers).mockResolvedValue(mockInfluencers);
    const user = userEvent.setup();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.getByText('User Two')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search name or handle...');
    await user.type(searchInput, 'User One');

    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument();
      expect(screen.queryByText('User Two')).not.toBeInTheDocument();
    });
  });

  it('header shows Influencer CRM title', async () => {
    vi.mocked(api.getInfluencers).mockResolvedValueOnce([]);

    render(<DashboardPage />);

    const heading = screen.getByRole('heading', { level: 1, name: 'Influencer CRM' });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText('Manage your influencer partnerships')).toBeInTheDocument();
  });
});
