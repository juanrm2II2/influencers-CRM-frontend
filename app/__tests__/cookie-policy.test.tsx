import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CookiePolicyPage from '../../app/cookie-policy/page';

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

describe('CookiePolicyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the cookie policy page', () => {
    render(<CookiePolicyPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Cookie Policy' })
    ).toBeInTheDocument();
  });

  it('renders cookie table', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByText('crm_access_token')).toBeInTheDocument();
    expect(screen.getByText('XSRF-TOKEN')).toBeInTheDocument();
    expect(screen.getByText('cookie_consent')).toBeInTheDocument();
  });

  it('renders key sections', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByText('1. What Are Cookies')).toBeInTheDocument();
    expect(screen.getByText('2. How We Use Cookies')).toBeInTheDocument();
    expect(screen.getByText('3. Managing Cookies')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<CookiePolicyPage />);

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
