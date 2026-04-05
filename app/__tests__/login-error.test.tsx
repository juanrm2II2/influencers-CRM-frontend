import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginError from '@/app/login/error';

describe('LoginError', () => {
  const mockReset = vi.fn();
  const mockError = new Error('Test login error') as Error & { digest?: string };

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReset.mockClear();
  });

  it('renders the error heading', () => {
    render(<LoginError error={mockError} reset={mockReset} />);
    expect(screen.getByText('Login unavailable')).toBeInTheDocument();
  });

  it('calls reset when try again is clicked', () => {
    render(<LoginError error={mockError} reset={mockReset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('logs the error to console', () => {
    render(<LoginError error={mockError} reset={mockReset} />);
    expect(console.error).toHaveBeenCalledWith('Login error:', mockError);
  });
});
