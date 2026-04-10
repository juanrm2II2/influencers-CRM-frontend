import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TermsPage from '../../app/terms/page';

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

describe('TermsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the terms page', () => {
    render(<TermsPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Terms of Service' })
    ).toBeInTheDocument();
  });

  it('renders key sections', () => {
    render(<TermsPage />);

    expect(screen.getByText('1. Acceptance of Terms')).toBeInTheDocument();
    expect(screen.getByText('4. Acceptable Use')).toBeInTheDocument();
    expect(screen.getByText('6. Data and Privacy')).toBeInTheDocument();
  });

  it('links to privacy policy', () => {
    render(<TermsPage />);

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy'
    );
  });

  it('renders footer', () => {
    render(<TermsPage />);

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
