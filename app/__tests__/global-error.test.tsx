import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test global error') as Error & { digest?: string };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReset.mockClear();
  });

  it('renders the error message', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred. Please try again.')
    ).toBeInTheDocument();
  });

  it('renders a try again button', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls reset when try again is clicked', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('logs the error to console', () => {
    render(<GlobalError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Global error:', mockError);
  });
});
