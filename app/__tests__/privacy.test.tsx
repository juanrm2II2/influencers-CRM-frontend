import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPolicyPage from '../../app/privacy/page';

vi.mock('@/components/Footer', () => ({
  default: () => <footer data-testid="footer">Footer</footer>,
}));

describe('PrivacyPolicyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the privacy policy page', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeInTheDocument();
  });

  it('renders key sections', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText('1. Introduction')).toBeInTheDocument();
    expect(screen.getByText('2. Information We Collect')).toBeInTheDocument();
    expect(screen.getByText('4. Legal Basis for Processing (GDPR)')).toBeInTheDocument();
    expect(screen.getByText('7. California Privacy Rights (CCPA)')).toBeInTheDocument();
  });

  it('has a CCPA section with id anchor', () => {
    render(<PrivacyPolicyPage />);

    const ccpaSection = document.getElementById('ccpa');
    expect(ccpaSection).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});
