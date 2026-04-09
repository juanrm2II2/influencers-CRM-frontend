import axios from 'axios';
import { Influencer, Outreach, DashboardFilters } from '@/types';
import { getCsrfToken, CSRF_HEADER_NAME, CSRF_METHODS } from '@/lib/csrf';

const USER_KEY = 'crm_user';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  withCredentials: true, // Send httpOnly cookies with every request
});

// ─── Request interceptor: attach CSRF token (double-submit cookie) ─────────

api.interceptors.request.use((config) => {
  const method = (config.method ?? '').toLowerCase();
  if (CSRF_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers.set(CSRF_HEADER_NAME, token);
    }
  }
  return config;
});

// ─── Response interceptor: handle 401 Unauthorized ─────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined'
    ) {
      // Clear stored user info and redirect to login
      try {
        sessionStorage.removeItem(USER_KEY);
      } catch {
        // Ignore
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function getInfluencers(filters?: DashboardFilters): Promise<Influencer[]> {
  const params: Record<string, string> = {};
  if (filters?.platform) params.platform = filters.platform;
  if (filters?.status) params.status = filters.status;
  if (filters?.niche) params.niche = filters.niche;
  if (filters?.min_followers) params.min_followers = filters.min_followers;
  const { data } = await api.get<Influencer[]>('/api/influencers', { params });
  return data;
}

export async function getInfluencer(id: string): Promise<Influencer> {
  const { data } = await api.get<Influencer>(`/api/influencers/${id}`);
  return data;
}

export async function searchInfluencer(handle: string, platform: string, niche?: string): Promise<Influencer> {
  const { data } = await api.post<Influencer>('/api/influencers/search', { handle, platform, ...(niche ? { niche } : {}) });
  return data;
}

export async function bulkSearchInfluencers(
  handles: string[],
  platform: string
): Promise<{ saved: number; errors: number; results: Influencer[] }> {
  const { data } = await api.post('/api/influencers/bulk-search', { handles, platform });
  return data;
}

export async function updateInfluencer(
  id: string,
  updates: Partial<Pick<Influencer, 'status' | 'niche' | 'notes'>>
): Promise<Influencer> {
  const { data } = await api.patch<Influencer>(`/api/influencers/${id}`, updates);
  return data;
}

export async function deleteInfluencer(id: string): Promise<void> {
  await api.delete(`/api/influencers/${id}`);
}

export async function logOutreach(
  influencerId: string,
  outreach: {
    contact_date: string;
    channel: string;
    message_sent: string;
    response?: string;
    follow_up_date?: string;
  }
): Promise<Outreach> {
  const { data } = await api.post<Outreach>(`/api/influencers/${influencerId}/outreach`, outreach);
  return data;
}
