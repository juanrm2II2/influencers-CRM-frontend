import { createClient } from '@/lib/supabase/client';
import { Influencer, Outreach, DashboardFilters } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const USER_KEY = 'crm_user';

function clearSessionAndRedirect(): void {
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // Ignore
  }
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

// ─── CRUD via Supabase PostgREST (anon key + user JWT → RLS) ───────────────

export async function getInfluencers(filters?: DashboardFilters): Promise<Influencer[]> {
  const supabase = createClient();
  let query = supabase.from('influencers').select('*, outreach(*)');

  if (filters?.platform) query = query.eq('platform', filters.platform);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.niche) query = query.eq('niche', filters.niche);
  if (filters?.min_followers) query = query.gte('followers', Number(filters.min_followers));

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    if (error.code === 'PGRST301') clearSessionAndRedirect();
    throw new Error(error.message);
  }
  return data as Influencer[];
}

export async function getInfluencer(id: string): Promise<Influencer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('influencers')
    .select('*, outreach(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST301') clearSessionAndRedirect();
    throw new Error(error.message);
  }
  return data as Influencer;
}

export async function updateInfluencer(
  id: string,
  updates: Partial<Pick<Influencer, 'status' | 'niche' | 'notes'>>,
): Promise<Influencer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('influencers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Influencer;
}

export async function deleteInfluencer(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('influencers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function logOutreach(
  influencerId: string,
  outreach: {
    contact_date: string;
    channel: string;
    message_sent: string;
    response?: string;
    follow_up_date?: string;
  },
): Promise<Outreach> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('outreach')
    .insert({ ...outreach, influencer_id: influencerId })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Outreach;
}

// ─── Scrape operations via Supabase Edge Functions ─────────────────────────

export async function searchInfluencer(handle: string, platform: string): Promise<Influencer> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('search-influencer', {
    body: { handle, platform },
  });

  if (error) throw new Error(error.message);
  return data as Influencer;
}

export async function bulkSearchInfluencers(
  handles: string[],
  platform: string,
): Promise<{ saved: number; errors: number; results: Influencer[] }> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke('bulk-search-influencers', {
    body: { handles, platform },
  });

  if (error) throw new Error(error.message);
  return data as { saved: number; errors: number; results: Influencer[] };
}
