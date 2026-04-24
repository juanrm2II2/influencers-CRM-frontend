import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { Influencer, Outreach, DashboardFilters } from '@/types';
import { getCsrfToken, CSRF_HEADER_NAME, CSRF_METHODS } from '@/lib/csrf';
import { API_URL } from '@/lib/config';

const USER_KEY = 'crm_user';

/**
 * Sentinel thrown by the request interceptor when a state-changing call
 * goes out without an XSRF-TOKEN cookie. Surfaced as a typed error so
 * callers can render a "session expired, please refresh" UI instead of
 * letting the request hit the backend and be rejected as a 403.
 */
export class MissingCsrfTokenError extends Error {
  constructor(method: string, url: string) {
    super(
      `Refusing to send ${method.toUpperCase()} ${url} — missing XSRF-TOKEN. ` +
        'The bootstrap call to /api/csrf has not yet succeeded.',
    );
    this.name = 'MissingCsrfTokenError';
  }
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Send httpOnly cookies with every request
  // ── Hard timeout (audit H-03) ─────────────────────────────────────────
  // Without an explicit timeout a slow / partitioned backend would let
  // requests hang indefinitely, freezing the UI and leaking
  // AbortController-less unmount races. 30 s is generous for legitimate
  // long-poll-style endpoints while still bounding the worst case.
  timeout: 30_000,
});

// ─── Request interceptor: attach CSRF token (double-submit cookie) ─────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? '').toLowerCase();
  if (CSRF_METHODS.has(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers.set(CSRF_HEADER_NAME, token);
    } else if (typeof window !== 'undefined') {
      // (audit M-05) Refuse to dispatch a state-changing request when no
      // XSRF-TOKEN cookie is present. The backend would reject it as a
      // 403 anyway, but failing client-side surfaces the misconfiguration
      // immediately and prevents accidental side-effects on a backend
      // that does not (yet) enforce CSRF.
      throw new MissingCsrfTokenError(method, String(config.url ?? ''));
    }
  }
  return config;
});

// ─── Response interceptor: handle 401 Unauthorized ─────────────────────────
//
// Audit H-03: deduplicate concurrent 401s. Without this, a burst of
// in-flight requests from different React effects all see the same
// expired session and each one navigates to /login, producing redirect
// loops and clobbering any in-progress logout state. We funnel every
// 401 through a single boolean latch so the redirect runs exactly once
// per page lifetime.
let logoutInFlight = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !logoutInFlight
    ) {
      logoutInFlight = true;
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

// ─── CSRF bootstrap ─────────────────────────────────────────────────────────
//
// Audit M-05: ensure the XSRF-TOKEN cookie is seeded on app load. Without
// this the *first* state-changing request after a fresh visit (or after
// third-party-cookie stripping clobbers the cookie) would have to round-
// trip a 403 before the user could retry. We call it eagerly from
// `AuthProvider`'s bootstrap effect so it is fired exactly once per page
// lifetime, before any state-changing call.
let csrfBootstrap: Promise<void> | null = null;
export function bootstrapCsrfToken(): Promise<void> {
  if (csrfBootstrap) return csrfBootstrap;
  csrfBootstrap = (async () => {
    try {
      // Best-effort GET; the backend is expected to respond with the
      // Set-Cookie header for XSRF-TOKEN. We do NOT throw on failure —
      // the user can still browse public pages — but the next
      // state-changing call will throw `MissingCsrfTokenError`, which
      // surfaces the misconfiguration in the UI instead of silently
      // 403'ing.
      await api.get('/api/csrf');
    } catch {
      // Reset so a future caller can retry (e.g. after a network blip).
      csrfBootstrap = null;
    }
  })();
  return csrfBootstrap;
}

/** @internal Test-only helper: reset the singleton bootstrap promise. */
export function __resetCsrfBootstrapForTests(): void {
  csrfBootstrap = null;
}

/** @internal Test-only helper: reset the 401 redirect latch. */
export function __resetLogoutLatchForTests(): void {
  logoutInFlight = false;
}

export async function getInfluencers(
  filters?: DashboardFilters,
  options?: { signal?: AbortSignal }
): Promise<Influencer[]> {
  const params: Record<string, string> = {};
  if (filters?.platform) params.platform = filters.platform;
  if (filters?.status) params.status = filters.status;
  if (filters?.niche) params.niche = filters.niche;
  if (filters?.min_followers) params.min_followers = filters.min_followers;
  const { data } = await api.get<Influencer[]>('/api/influencers', {
    params,
    signal: options?.signal,
  });
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

// ─── GDPR audit log (M-04) ──────────────────────────────────────────────────

/**
 * POST a data-export audit event to the backend so the immutable audit
 * trail required by GDPR Art. 15 / Art. 30 is complete. The call is
 * best-effort — failure is logged but never blocks the user's download
 * (depriving them of their data right would be a worse compliance
 * outcome). The backend is responsible for storing the event for at
 * least the statutory retention window.
 */
export async function logDataExportEvent(payload: {
  format: 'csv' | 'json';
  rowCount: number;
  success: boolean;
  errorMessage?: string;
}): Promise<void> {
  try {
    await api.post('/api/audit/data-export', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Best-effort: do not surface the failure to the caller.
  }
}

// ─── Cookie-consent backend mirror (L-06) ──────────────────────────────────

/**
 * Mirror cookie-consent state to the backend so the controller can
 * demonstrate consent on audit (GDPR Art. 7(1)). The frontend continues
 * to persist the choice locally so the banner does not re-appear on
 * reload, but the authoritative trace lives behind a server-side log.
 */
export async function recordCookieConsent(payload: {
  consent: 'accepted' | 'rejected';
}): Promise<void> {
  try {
    await api.post('/api/consent', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Best-effort: do not block UI on failure.
  }
}

// Re-export the AxiosError type so callers can narrow without a direct
// dependency on `axios`.
export { AxiosError };
