import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AppError from '@/app/error';

describe('AppError', () => {
  const mockReset = vi.fn();
  const mockError = Object.assign(new globalThis.Error('Test app error'), {
    digest: undefined,
  }) as globalThis.Error & { digest?: string };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReset.mockClear();
  });

  it('renders the error message', () => {
    render(<AppError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('calls reset when try again is clicked', () => {
    render(<AppError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('logs the error to console', () => {
    render(<AppError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('App error:', mockError);
  });
});
