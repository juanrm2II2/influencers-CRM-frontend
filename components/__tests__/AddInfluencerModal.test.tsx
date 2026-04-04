import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddInfluencerModal from '../AddInfluencerModal';
import * as api from '@/lib/api';
import type { Influencer } from '@/types';

vi.mock('@/lib/api', () => ({
  searchInfluencer: vi.fn(),
}));

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const mockInfluencer: Influencer = {
  id: '1',
  handle: 'cristiano',
  platform: 'instagram',
  full_name: 'Cristiano Ronaldo',
  bio: 'Football player',
  followers: 600000000,
  following: 500,
  avg_likes: 5000000,
  avg_views: 10000000,
  engagement_rate: 2.5,
  profile_pic_url: 'https://example.com/cr7.jpg',
  profile_url: 'https://instagram.com/cristiano',
  niche: 'sports',
  status: 'prospect',
  notes: '',
  last_scraped: '2024-01-01',
  created_at: '2024-01-01',
};

function getHandleInput() {
  return screen.getByPlaceholderText('e.g. cristiano');
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /Add Influencer/i });
}

describe('AddInfluencerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with form fields', () => {
    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    expect(screen.getByText('Add Influencer', { selector: 'h2' })).toBeInTheDocument();
    expect(getHandleInput()).toBeInTheDocument();
    expect(screen.getByText('Platform')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits form and calls onSuccess on success', async () => {
    vi.mocked(api.searchInfluencer).mockResolvedValueOnce(mockInfluencer);
    const user = userEvent.setup();

    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.type(getHandleInput(), 'cristiano');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockInfluencer);
    });
  });

  it('shows error on API failure', async () => {
    vi.mocked(api.searchInfluencer).mockRejectedValueOnce(new Error('Not found'));
    const user = userEvent.setup();

    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.type(getHandleInput(), 'unknownuser');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });
  });

  it('shows generic error for non-Error rejects', async () => {
    vi.mocked(api.searchInfluencer).mockRejectedValueOnce('something weird');
    const user = userEvent.setup();

    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.type(getHandleInput(), 'testuser');
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch influencer. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveSearch: (value: Influencer) => void;
    vi.mocked(api.searchInfluencer).mockImplementationOnce(
      () => new Promise((resolve) => { resolveSearch = resolve; }),
    );

    const user = userEvent.setup();
    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.type(getHandleInput(), 'test');
    await user.click(getSubmitButton());

    expect(screen.getByText('Searching...')).toBeInTheDocument();

    // Resolve to clean up
    resolveSearch!(mockInfluencer);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('does not submit when handle is empty', async () => {
    const user = userEvent.setup();
    render(<AddInfluencerModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await user.click(getSubmitButton());

    expect(api.searchInfluencer).not.toHaveBeenCalled();
  });
});
