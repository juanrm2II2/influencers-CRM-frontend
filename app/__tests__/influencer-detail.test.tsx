import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InfluencerDetailPage from '../../app/influencers/[id]/page';
import * as api from '@/lib/api';
import type { Influencer, Outreach } from '@/types';

const mockPush = vi.fn();
const mockParams = { id: 'inf1' };

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  getInfluencer: vi.fn(),
  updateInfluencer: vi.fn(),
  deleteInfluencer: vi.fn(),
  logOutreach: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' },
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

const mockOutreach: Outreach = {
  id: 'o1',
  influencer_id: 'inf1',
  contact_date: '2024-01-15',
  channel: 'email',
  message_sent: 'Hello world',
  response: 'Thanks!',
  follow_up_date: '2024-01-20',
  created_at: '2024-01-15',
};

const mockInfluencer: Influencer = {
  id: 'inf1',
  handle: 'cristiano',
  platform: 'instagram',
  full_name: 'Cristiano Ronaldo',
  bio: 'Football legend',
  followers: 600000000,
  following: 550,
  avg_likes: 5000000,
  avg_views: 10000000,
  engagement_rate: 2.5,
  profile_pic_url: 'https://example.com/cr7.jpg',
  profile_url: 'https://instagram.com/cristiano',
  niche: 'sports',
  status: 'active',
  notes: 'Important contact',
  last_scraped: '2024-01-01',
  created_at: '2024-01-01',
  outreach: [mockOutreach],
};

describe('InfluencerDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(api.getInfluencer).mockImplementation(() => new Promise(() => {}));
    render(<InfluencerDetailPage />);

    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders influencer details after loading', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
      expect(screen.getByText('@cristiano')).toBeInTheDocument();
      expect(screen.getByText('Football legend')).toBeInTheDocument();
      expect(screen.getByText('sports')).toBeInTheDocument();
    });
  });

  it('shows error state on API failure', async () => {
    vi.mocked(api.getInfluencer).mockRejectedValueOnce(new Error('Not found'));
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load influencer.')).toBeInTheDocument();
    });

    expect(screen.getByText('← Back to Dashboard')).toBeInTheDocument();
  });

  it('displays formatted follower counts', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('600.0M')).toBeInTheDocument();
    });
  });

  it('displays engagement rate', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('2.50%')).toBeInTheDocument();
    });
  });

  it('displays outreach history', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Outreach History')).toBeInTheDocument();
      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Thanks!')).toBeInTheDocument();
    });
  });

  it('shows empty outreach message when none logged', async () => {
    const noOutreach = { ...mockInfluencer, outreach: [] };
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(noOutreach);
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/No outreach logged yet/)).toBeInTheDocument();
    });
  });

  it('changes status via dropdown', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    vi.mocked(api.updateInfluencer).mockResolvedValueOnce({
      ...mockInfluencer,
      status: 'contacted',
    });

    const user = userEvent.setup();
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    });

    const statusSelect = screen.getByDisplayValue('Active');
    await user.selectOptions(statusSelect, 'contacted');

    expect(api.updateInfluencer).toHaveBeenCalledWith('inf1', { status: 'contacted' });
  });

  it('saves notes on blur', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    vi.mocked(api.updateInfluencer).mockResolvedValueOnce(mockInfluencer);

    const user = userEvent.setup();
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    });

    const notesArea = screen.getByPlaceholderText('Add notes about this influencer...');
    await user.clear(notesArea);
    await user.type(notesArea, 'Updated notes');
    await user.tab(); // trigger onBlur

    expect(api.updateInfluencer).toHaveBeenCalledWith('inf1', { notes: 'Updated notes' });
  });

  it('deletes influencer and navigates to dashboard', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    vi.mocked(api.deleteInfluencer).mockResolvedValueOnce(undefined);
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(api.deleteInfluencer).toHaveBeenCalledWith('inf1');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('does not delete if confirm is cancelled', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const user = userEvent.setup();
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Delete'));

    expect(api.deleteInfluencer).not.toHaveBeenCalled();
  });

  it('opens Log Outreach modal', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);

    const user = userEvent.setup();
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '+ Log Outreach' }));

    // After clicking, the modal should open with the "Log Outreach" heading
    // and the form fields
    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write the message you sent...')).toBeInTheDocument();
  });

  it('shows profile link when available', async () => {
    vi.mocked(api.getInfluencer).mockResolvedValueOnce(mockInfluencer);
    render(<InfluencerDetailPage />);

    await waitFor(() => {
      const link = screen.getByText('View Profile ↗');
      expect(link).toHaveAttribute('href', 'https://instagram.com/cristiano');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });
});
