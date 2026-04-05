import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DashboardError from '@/app/dashboard/error';

describe('DashboardError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test dashboard error') as Error & { digest?: string };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReset.mockClear();
  });

  it('renders the error heading', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
  });

  it('renders the CRM header', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Influencer CRM')).toBeInTheDocument();
  });

  it('calls reset when try again is clicked', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('renders a link to dashboard', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    const link = screen.getByRole('link', { name: /go to dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('logs the error to console', () => {
    render(<DashboardError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Dashboard error:', mockError);
  });
});
