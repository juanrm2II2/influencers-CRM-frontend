import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CookieConsent from '../CookieConsent';

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows banner when no consent is stored', () => {
    render(<CookieConsent />);

    expect(screen.getByRole('dialog', { name: 'Cookie consent' })).toBeInTheDocument();
    expect(screen.getByText(/We use essential cookies/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Accept All' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reject Non-Essential' })
    ).toBeInTheDocument();
  });

  it('hides banner when consent was previously accepted', () => {
    localStorage.setItem('cookie_consent', 'accepted');

    render(<CookieConsent />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('hides banner when consent was previously rejected', () => {
    localStorage.setItem('cookie_consent', 'rejected');

    render(<CookieConsent />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stores "accepted" and hides banner on Accept All click', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(screen.getByRole('button', { name: 'Accept All' }));

    expect(localStorage.getItem('cookie_consent')).toBe('accepted');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stores "rejected" and hides banner on Reject click', async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(
      screen.getByRole('button', { name: 'Reject Non-Essential' })
    );

    expect(localStorage.getItem('cookie_consent')).toBe('rejected');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders cookie policy link', () => {
    render(<CookieConsent />);

    const link = screen.getByRole('link', { name: 'Cookie Policy' });
    expect(link).toHaveAttribute('href', '/cookie-policy');
  });
});
