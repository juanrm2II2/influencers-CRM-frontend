export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'twitter';
export type Status = 'prospect' | 'contacted' | 'negotiating' | 'active' | 'declined';
export type Channel = 'email' | 'dm' | 'telegram';

// ─── Authentication & Authorization types ────────────────────────────────────

export type Role = 'admin' | 'manager' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Influencer {
  id: string;
  handle: string;
  platform: Platform;
  full_name: string;
  bio: string;
  followers: number;
  following: number;
  avg_likes: number;
  avg_views: number;
  engagement_rate: number;
  profile_pic_url: string;
  profile_url: string;
  niche: string;
  status: Status;
  notes: string;
  last_scraped: string;
  created_at: string;
  outreach?: Outreach[];
}

export interface Outreach {
  id: string;
  influencer_id: string;
  contact_date: string;
  channel: Channel;
  message_sent: string;
  response: string;
  follow_up_date: string;
  created_at: string;
}

export interface DashboardFilters {
  platform?: string;
  status?: string;
  niche?: string;
  min_followers?: string;
  search?: string;
}
