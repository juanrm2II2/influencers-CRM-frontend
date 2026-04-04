import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Influencer, Outreach } from '@/types';

// Create mock methods that we'll configure per test
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();

vi.mock('axios', () => {
  return {
    default: {
      create: () => ({
        get: mockGet,
        post: mockPost,
        patch: mockPatch,
        delete: mockDelete,
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
      isAxiosError: vi.fn(),
    },
  };
});

const mockInfluencer: Influencer = {
  id: '1',
  handle: 'testuser',
  platform: 'instagram',
  full_name: 'Test User',
  bio: 'Test bio',
  followers: 10000,
  following: 500,
  avg_likes: 1000,
  avg_views: 5000,
  engagement_rate: 5.0,
  profile_pic_url: 'https://example.com/pic.jpg',
  profile_url: 'https://instagram.com/testuser',
  niche: 'tech',
  status: 'active',
  notes: 'Some notes',
  last_scraped: '2024-01-01',
  created_at: '2024-01-01',
};

const mockOutreach: Outreach = {
  id: 'o1',
  influencer_id: '1',
  contact_date: '2024-01-15',
  channel: 'email',
  message_sent: 'Hello!',
  response: 'Thanks!',
  follow_up_date: '2024-01-20',
  created_at: '2024-01-15',
};

describe('lib/api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInfluencers', () => {
    it('fetches all influencers without filters', async () => {
      mockGet.mockResolvedValue({ data: [mockInfluencer] });
      const { getInfluencers } = await import('../api');

      const result = await getInfluencers();

      expect(mockGet).toHaveBeenCalledWith('/api/influencers', { params: {} });
      expect(result).toEqual([mockInfluencer]);
    });

    it('passes filter params correctly', async () => {
      mockGet.mockResolvedValue({ data: [] });
      const { getInfluencers } = await import('../api');

      await getInfluencers({
        platform: 'instagram',
        status: 'active',
        niche: 'tech',
        min_followers: '1000',
      });

      expect(mockGet).toHaveBeenCalledWith('/api/influencers', {
        params: {
          platform: 'instagram',
          status: 'active',
          niche: 'tech',
          min_followers: '1000',
        },
      });
    });

    it('omits undefined filter values', async () => {
      mockGet.mockResolvedValue({ data: [] });
      const { getInfluencers } = await import('../api');

      await getInfluencers({ platform: 'tiktok' });

      expect(mockGet).toHaveBeenCalledWith('/api/influencers', {
        params: { platform: 'tiktok' },
      });
    });
  });

  describe('getInfluencer', () => {
    it('fetches a single influencer by id', async () => {
      mockGet.mockResolvedValue({ data: mockInfluencer });
      const { getInfluencer } = await import('../api');

      const result = await getInfluencer('1');

      expect(mockGet).toHaveBeenCalledWith('/api/influencers/1');
      expect(result).toEqual(mockInfluencer);
    });
  });

  describe('searchInfluencer', () => {
    it('posts search request with handle and platform', async () => {
      mockPost.mockResolvedValue({ data: mockInfluencer });
      const { searchInfluencer } = await import('../api');

      const result = await searchInfluencer('testuser', 'instagram');

      expect(mockPost).toHaveBeenCalledWith('/api/influencers/search', {
        handle: 'testuser',
        platform: 'instagram',
      });
      expect(result).toEqual(mockInfluencer);
    });
  });

  describe('bulkSearchInfluencers', () => {
    it('posts bulk search request', async () => {
      const response = { saved: 2, errors: 0, results: [mockInfluencer] };
      mockPost.mockResolvedValue({ data: response });
      const { bulkSearchInfluencers } = await import('../api');

      const result = await bulkSearchInfluencers(['user1', 'user2'], 'tiktok');

      expect(mockPost).toHaveBeenCalledWith('/api/influencers/bulk-search', {
        handles: ['user1', 'user2'],
        platform: 'tiktok',
      });
      expect(result).toEqual(response);
    });
  });

  describe('updateInfluencer', () => {
    it('patches influencer with updates', async () => {
      const updated = { ...mockInfluencer, status: 'contacted' as const };
      mockPatch.mockResolvedValue({ data: updated });
      const { updateInfluencer } = await import('../api');

      const result = await updateInfluencer('1', { status: 'contacted' });

      expect(mockPatch).toHaveBeenCalledWith('/api/influencers/1', { status: 'contacted' });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteInfluencer', () => {
    it('deletes influencer by id', async () => {
      mockDelete.mockResolvedValue({});
      const { deleteInfluencer } = await import('../api');

      await deleteInfluencer('1');

      expect(mockDelete).toHaveBeenCalledWith('/api/influencers/1');
    });
  });

  describe('logOutreach', () => {
    it('posts outreach data for an influencer', async () => {
      mockPost.mockResolvedValue({ data: mockOutreach });
      const { logOutreach } = await import('../api');

      const outreachData = {
        contact_date: '2024-01-15',
        channel: 'email',
        message_sent: 'Hello!',
        response: 'Thanks!',
        follow_up_date: '2024-01-20',
      };

      const result = await logOutreach('1', outreachData);

      expect(mockPost).toHaveBeenCalledWith('/api/influencers/1/outreach', outreachData);
      expect(result).toEqual(mockOutreach);
    });

    it('posts outreach without optional fields', async () => {
      mockPost.mockResolvedValue({ data: mockOutreach });
      const { logOutreach } = await import('../api');

      const outreachData = {
        contact_date: '2024-01-15',
        channel: 'dm',
        message_sent: 'Hi there!',
      };

      await logOutreach('1', outreachData);

      expect(mockPost).toHaveBeenCalledWith('/api/influencers/1/outreach', outreachData);
    });
  });
});
