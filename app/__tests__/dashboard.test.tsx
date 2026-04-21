import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../../app/dashboard/page';
import * as api from '@/lib/api';
import type { Influencer } from '@/types';

vi.mock('@/lib/api', () => ({
  getInfluencers: vi.fn(),
  searchInfluencer: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'admin@test.com', name: 'Admin User', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    hasRole: vi.fn(),
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  default: ({ alt, src, ...props }: { alt: string; src: string; [key: string]: unknown }) => (
    <img alt={alt} src={src} {...props} />
  ),
}));

const mockInfluencers: Influencer[] = [
  {
    id: '1',
    handle: 'user1',
    platform: 'instagram',
    full_name: 'User One',
    bio: 'Bio 1',
    followers: 50000,
    following: 500,
    avg_likes: 2000,
    avg_views: 5000,
    engagement_rate: 4.0,
    profile_pic_url: 'https://example.com/1.jpg',
    profile_url: 'https://instagram.com/user1',
    niche: 'tech',
    status: 'active',
    notes: '',
    last_scraped: '2024-01-01',
    created_at: '2024-01-01',
  },
  {
    id: '2',
    handle: 'user2',
    platform: 'tiktok',
    full_name: 'User Two',
    bio: 'Bio 2',
    followers: 1200000,
    following: 300,
    avg_likes: 50000,
    avg_views: 200000,
    engagement_rate: 6.5,
    profile_pic_url: 'https
