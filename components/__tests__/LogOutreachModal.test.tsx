import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogOutreachModal from '../LogOutreachModal';
import * as api from '@/lib/api';
import type { Outreach } from '@/types';

vi.mock('@/lib/api', () => ({
  logOutreach: vi.fn(),
}));

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const mockOutreach: Outreach = {
  id: 'o1',
  influencer_id: 'inf1',
  contact_date: '2024-01-15',
  channel: 'dm',
  message_sent: 'Hello!',
  response: '',
  follow_up_date: '',
  created_at: '2024-01-15',
};

describe('LogOutreachModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with form fields', () => {
    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    expect(screen.getByText('Log Outreach', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('Channel')).toBeInTheDocument();
    expect(screen.getByText('Contact Date')).toBeInTheDocument();
    expect(screen.getByText('Message Sent')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    await user.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    await user.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('submits form and calls onSuccess on success', async () => {
    vi.mocked(api.logOutreach).mockResolvedValueOnce(mockOutreach);
    const user = userEvent.setup();

    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const messageInput = screen.getByPlaceholderText('Write the message you sent...');
    await user.type(messageInput, 'Hello there!');
    await user.click(screen.getByRole('button', { name: /Log Outreach/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(mockOutreach);
    });
  });

  it('shows error on API failure', async () => {
    vi.mocked(api.logOutreach).mockRejectedValueOnce(new Error('Server error'));
    const user = userEvent.setup();

    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    await user.type(screen.getByPlaceholderText('Write the message you sent...'), 'Test message');
    await user.click(screen.getByRole('button', { name: /Log Outreach/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('shows generic error for non-Error rejection', async () => {
    vi.mocked(api.logOutreach).mockRejectedValueOnce('weird');
    const user = userEvent.setup();

    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    await user.type(screen.getByPlaceholderText('Write the message you sent...'), 'Test');
    await user.click(screen.getByRole('button', { name: /Log Outreach/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Failed to log outreach. Please try again.'),
      ).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    let resolveOutreach: (value: Outreach) => void;
    vi.mocked(api.logOutreach).mockImplementationOnce(
      () => new Promise((resolve) => { resolveOutreach = resolve; }),
    );

    const user = userEvent.setup();
    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    await user.type(screen.getByPlaceholderText('Write the message you sent...'), 'Hello');
    await user.click(screen.getByRole('button', { name: /Log Outreach/i }));

    expect(screen.getByText('Saving...')).toBeInTheDocument();

    resolveOutreach!(mockOutreach);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('allows changing channel', async () => {
    const user = userEvent.setup();
    render(
      <LogOutreachModal influencerId="inf1" onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );

    const channelSelects = screen.getAllByRole('combobox');
    const channelSelect = channelSelects[0]; // First select is channel
    await user.selectOptions(channelSelect, 'email');
    expect((channelSelect as HTMLSelectElement).value).toBe('email');
  });
});
