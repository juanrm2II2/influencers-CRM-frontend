import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Influencer, Outreach } from '@/types';

// ── Supabase mock helpers ──────────────────────────────────────────────────

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteFn = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockInvoke = vi.fn();

// Chainable builder mock
function chainable(terminal?: Record<string, unknown>) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDeleteFn,
    eq: mockEq,
    gte: mockGte,
    single: mockSingle,
    order: mockOrder,
  };
  for (const fn of Object.values(chain)) {
    fn.mockReturnValue(new Proxy({}, {
      get(_t, prop: string) {
        if (prop === 'then') return undefined; // prevent auto-await
        return chain[prop] ?? vi.fn().mockReturnThis();
      },
    }));
  }
  if (terminal) {
    mockSingle.mockResolvedValue(terminal);
    mockOrder.mockResolvedValue(terminal);
    mockDeleteFn.mockReturnValue({
      eq: vi.fn().mockResolvedValue(terminal),
    });
  }
  return chain;
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDeleteFn,
      eq: mockEq,
      gte: mockGte,
      single: mockSingle,
      order: mockOrder,
    }),
    functions: {
      invoke: mockInvoke,
    },
  }),
}));

const mockInfluencer: Influencer = {
  id: '1',
  user_id: 'u1',
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
      // Setup chain: from().select().order() → resolves
      mockSelect.mockReturnValue({ eq: mockEq, gte: mockGte, order: mockOrder });
      mockOrder.mockResolvedValue({ data: [mockInfluencer], error: null });

      const { getInfluencers } = await import('../api');
      const result = await getInfluencers();

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual([mockInfluencer]);
    });

    it('passes filter params correctly', async () => {
      mockSelect.mockReturnValue({ eq: mockEq, gte: mockGte, order: mockOrder });
      mockEq.mockReturnValue({ eq: mockEq, gte: mockGte, order: mockOrder });
      mockGte.mockReturnValue({ eq: mockEq, gte: mockGte, order: mockOrder });
      mockOrder.mockResolvedValue({ data: [], error: null });

      const { getInfluencers } = await import('../api');
      await getInfluencers({
        platform: 'instagram',
        status: 'active',
        niche: 'tech',
        min_followers: '1000',
      });

      expect(mockEq).toHaveBeenCalledWith('platform', 'instagram');
      expect(mockEq).toHaveBeenCalledWith('status', 'active');
      expect(mockEq).toHaveBeenCalledWith('niche', 'tech');
      expect(mockGte).toHaveBeenCalledWith('followers', 1000);
    });

    it('throws on Supabase error', async () => {
      mockSelect.mockReturnValue({ eq: mockEq, gte: mockGte, order: mockOrder });
      mockOrder.mockResolvedValue({ data: null, error: { message: 'RLS denied', code: '42501' } });

      const { getInfluencers } = await import('../api');
      await expect(getInfluencers()).rejects.toThrow('RLS denied');
    });
  });

  describe('getInfluencer', () => {
    it('fetches a single influencer by id', async () => {
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: mockInfluencer, error: null });

      const { getInfluencer } = await import('../api');
      const result = await getInfluencer('1');

      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(mockInfluencer);
    });
  });

  describe('searchInfluencer', () => {
    it('invokes Edge Function with handle and platform', async () => {
      mockInvoke.mockResolvedValue({ data: mockInfluencer, error: null });
      const { searchInfluencer } = await import('../api');

      const result = await searchInfluencer('testuser', 'instagram');

      expect(mockInvoke).toHaveBeenCalledWith('search-influencer', {
        body: { handle: 'testuser', platform: 'instagram' },
      });
      expect(result).toEqual(mockInfluencer);
    });
  });

  describe('bulkSearchInfluencers', () => {
    it('invokes Edge Function for bulk search', async () => {
      const response = { saved: 2, errors: 0, results: [mockInfluencer] };
      mockInvoke.mockResolvedValue({ data: response, error: null });
      const { bulkSearchInfluencers } = await import('../api');

      const result = await bulkSearchInfluencers(['user1', 'user2'], 'tiktok');

      expect(mockInvoke).toHaveBeenCalledWith('bulk-search-influencers', {
        body: { handles: ['user1', 'user2'], platform: 'tiktok' },
      });
      expect(result).toEqual(response);
    });
  });

  describe('updateInfluencer', () => {
    it('updates influencer via Supabase', async () => {
      const updated = { ...mockInfluencer, status: 'contacted' as const };
      mockUpdate.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: updated, error: null });

      const { updateInfluencer } = await import('../api');
      const result = await updateInfluencer('1', { status: 'contacted' });

      expect(mockUpdate).toHaveBeenCalledWith({ status: 'contacted' });
      expect(result).toEqual(updated);
    });
  });

  describe('deleteInfluencer', () => {
    it('deletes influencer by id', async () => {
      mockDeleteFn.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      const { deleteInfluencer } = await import('../api');
      await deleteInfluencer('1');

      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });
  });

  describe('logOutreach', () => {
    it('inserts outreach data for an influencer', async () => {
      mockInsert.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: mockOutreach, error: null });

      const { logOutreach } = await import('../api');
      const outreachData = {
        contact_date: '2024-01-15',
        channel: 'email',
        message_sent: 'Hello!',
        response: 'Thanks!',
        follow_up_date: '2024-01-20',
      };

      const result = await logOutreach('1', outreachData);

      expect(mockInsert).toHaveBeenCalledWith({ ...outreachData, influencer_id: '1' });
      expect(result).toEqual(mockOutreach);
    });
  });
});
