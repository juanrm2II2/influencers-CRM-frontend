import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfluencerCard from '../InfluencerCard';
import type { Influencer } from '@/types';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

const baseInfluencer: Influencer = {
  id: '1',
  handle: 'testuser',
  platform: 'instagram',
  full_name: 'Test User',
  bio: 'A test bio',
  followers: 1500000,
  following: 500,
  avg_likes: 50000,
  avg_views: 100000,
  engagement_rate: 3.45,
  profile_pic_url: 'https://example.com/pic.jpg',
  profile_url: 'https://instagram.com/testuser',
  niche: 'tech',
  status: 'active',
  notes: '',
  last_scraped: '2024-01-01',
  created_at: '2024-01-01',
};

describe('InfluencerCard', () => {
  it('renders influencer name and handle', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('links to influencer detail page', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/influencers/1');
  });

  it('formats large follower counts', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    expect(screen.getByText('1.5M')).toBeInTheDocument();
  });

  it('formats thousands correctly', () => {
    const influencer = { ...baseInfluencer, followers: 5500 };
    render(<InfluencerCard influencer={influencer} />);

    expect(screen.getByText('5.5K')).toBeInTheDocument();
  });

  it('shows small numbers as-is', () => {
    const influencer = { ...baseInfluencer, followers: 999 };
    render(<InfluencerCard influencer={influencer} />);

    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('displays engagement rate with 2 decimals', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    expect(screen.getByText('3.45%')).toBeInTheDocument();
  });

  it('shows — when engagement_rate is null', () => {
    const influencer = { ...baseInfluencer, engagement_rate: null as unknown as number };
    render(<InfluencerCard influencer={influencer} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders niche badge', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    expect(screen.getByText('tech')).toBeInTheDocument();
  });

  it('does not render niche badge when niche is empty', () => {
    const influencer = { ...baseInfluencer, niche: '' };
    render(<InfluencerCard influencer={influencer} />);

    expect(screen.queryByText('tech')).not.toBeInTheDocument();
  });

  it('shows profile image when available', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    const img = screen.getByRole('img', { name: 'Test User' });
    expect(img).toHaveAttribute('src', 'https://example.com/pic.jpg');
  });

  it('shows initial letter when no profile pic', () => {
    const influencer = { ...baseInfluencer, profile_pic_url: '' };
    render(<InfluencerCard influencer={influencer} />);

    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders platform icon', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    expect(screen.getByText('📸')).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<InfluencerCard influencer={baseInfluencer} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('falls back to handle when full_name is empty', () => {
    const influencer = { ...baseInfluencer, full_name: '' };
    render(<InfluencerCard influencer={influencer} />);

    // The first text should be the handle
    const names = screen.getAllByText('testuser');
    expect(names.length).toBeGreaterThanOrEqual(1);
  });
});
