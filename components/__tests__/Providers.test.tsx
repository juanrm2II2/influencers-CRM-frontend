import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Providers from '../Providers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Providers', () => {
  it('renders children inside AuthProvider', () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
