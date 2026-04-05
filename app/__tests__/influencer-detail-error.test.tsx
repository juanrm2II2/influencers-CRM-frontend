import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InfluencerDetailError from '@/app/influencers/[id]/error';

describe('InfluencerDetailError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test influencer error') as Error & { digest?: string };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReset.mockClear();
  });

  it('renders the error heading', () => {
    render(<InfluencerDetailError error={mockError} reset={mockReset} />);
    expect(
      screen.getByText('Failed to load influencer details')
    ).toBeInTheDocument();
  });

  it('renders back to dashboard link', () => {
    render(<InfluencerDetailError error={mockError} reset={mockReset} />);
    const link = screen.getByRole('link', { name: 'Back to Dashboard' });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('calls reset when try again is clicked', () => {
    render(<InfluencerDetailError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('logs the error to console', () => {
    render(<InfluencerDetailError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith(
      'Influencer detail error:',
      mockError
    );
  });
});
