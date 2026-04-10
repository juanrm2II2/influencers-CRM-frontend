import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

describe('Footer', () => {
  beforeEach(() => {
    render(<Footer />);
  });

  it('renders the footer', () => {
    expect(screen.getByText('Influencer CRM')).toBeInTheDocument();
    expect(
      screen.getByText('Manage your influencer partnerships with confidence.')
    ).toBeInTheDocument();
  });

  it('renders legal links', () => {
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy'
    );
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms'
    );
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute(
      'href',
      '/cookie-policy'
    );
    expect(
      screen.getByRole('link', { name: 'Data Processing Agreement' })
    ).toHaveAttribute('href', '/dpa');
  });

  it('renders data practices link', () => {
    expect(screen.getByRole('link', { name: 'Data Practices' })).toHaveAttribute(
      'href',
      '/data-practices'
    );
  });

  it('renders CCPA "Do Not Sell" link', () => {
    const ccpaLink = screen.getByTestId('ccpa-link');
    expect(ccpaLink).toBeInTheDocument();
    expect(ccpaLink).toHaveAttribute('href', '/privacy#ccpa');
    expect(ccpaLink).toHaveTextContent('Do Not Sell My Personal Information');
  });

  it('renders copyright notice', () => {
    const year = new Date().getFullYear().toString();
    const copyrightEl = screen.getByText((_content, element) => {
      if (element?.tagName !== 'DIV') return false;
      // Match only the innermost div with the specific class
      if (!element.className.includes('text-center')) return false;
      return (
        element.textContent?.includes(year) === true &&
        element.textContent?.includes('Influencer CRM. All rights reserved.') === true
      );
    });
    expect(copyrightEl).toBeInTheDocument();
  });
});
