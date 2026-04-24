'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, LoginCredentials, Role } from '@/types';
import { csrfHeaders } from '@/lib/csrf';
import { API_URL } from '@/lib/config';
import { siweLogout } from '@/lib/web3/siwe';
import { bootstrapCsrfToken } from '@/lib/api';

// ─── Helpers ────────────────────────────────────────────────────────────────
// Tokens are now stored as httpOnly cookies set by the backend.
// Only the user profile (non-sensitive) is kept in sessionStorage for
// client-side UI state rehydration.

const USER_KEY = 'crm_user';
/**
 * Maximum age of the client-cached user profile. On load, any entry
 * older than this is discarded so a stale role cannot linger past the
 * window during which the backend has revoked it (audit H-01). 5 min
 * matches the upper bound of "tolerable role-revocation latency" used
 * by the backend session-revocation runbook; combined with the
 * BroadcastChannel listener below, an explicit revocation event from
 * any other tab purges the cache immediately.
 */
const USER_CACHE_TTL_MS = 5 * 60 * 1000;
/** BroadcastChannel name used for cross-tab role-revocation pushes. */
const ROLE_REVOCATION_CHANNEL = 'crm:role-revocation';
/** Idle timeout before auto-logout (30 min). */
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

interface PersistedUser {
  user: User;
  storedAt: number;
}

/**
 * Project the user record we persist to client storage. Anything that
 * isn't required by the UI rehydration path is stripped so we are not
 * keeping user PII in `sessionStorage` longer than necessary — the
 * authoritative copy lives behind the httpOnly session cookie and is
 * re-fetched via `/api/auth/me` on every mount.
 */
function projectCachedUser(user: User): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function persistUser(user: User): void {
  try {
    const payload: PersistedUser = {
      user: projectCachedUser(user),
      storedAt: Date.now(),
    };
    sessionStorage.setItem(USER_KEY, JSON.stringify(payload));
  } catch {
    // Ignore
  }
}

function loadUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedUser | User | null;
    if (!parsed || typeof parsed !== 'object') return null;
    // New wrapped format { user, storedAt } — enforce TTL.
    if ('storedAt' in parsed && 'user' in parsed) {
      if (Date.now() - parsed.storedAt > USER_CACHE_TTL_MS) {
        sessionStorage.removeItem(USER_KEY);
        return null;
      }
      return parsed.user;
    }
    // Legacy flat format: accept once so we don't log the user out on
    // deploy of the TTL change, and rewrite in the new format so the
    // next load enforces the TTL.
    if ('id' in parsed && 'role' in parsed) {
      const legacy = parsed as User;
      persistUser(legacy);
      return legacy;
    }
    sessionStorage.removeItem(USER_KEY);
    return null;
  } catch {
    return null;
  }
}

function clearUser(): void {
  try {
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // Ignore
  }
}

// ─── Context type ──────────────────────────────────────────────────────────

interface LoginOptions {
  /** Same-origin path to navigate to after login. Caller is responsible
   *  for validating with `sanitizeRedirectTarget`. */
  redirectTo?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, options?: LoginOptions) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (requiredRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Role hierarchy ─────────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<Role, number> = {
  viewer: 0,
  manager: 1,
  admin: 2,
};

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  // Initialize from sessionStorage ONCE (safe fallback, no flashing)
  const [user, setUser] = useState<User | null>(() => loadUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // (audit L-03) Abort the in-flight bootstrap fetch on unmount so a
    // navigation away from the layout host doesn't leak the request or
    // accidentally setState on an unmounted tree.
    const controller = new AbortController();

    // (audit M-05) Seed the XSRF-TOKEN cookie before any state-changing
    // call. Best-effort — failure surfaces later via the request
    // interceptor in lib/api.ts.
    void bootstrapCsrfToken();

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { accept: 'application/json' },
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            clearUser();
          }
          return;
        }

        const data = (await res.json()) as { user?: User } | User | null;
        const fresh =
          (data && typeof data === 'object' && 'user' in data ? data.user : (data as User | null)) ?? null;

        if (!cancelled) {
          if (fresh) {
            setUser(fresh);
            persistUser(fresh);
          } else {
            setUser(null);
            clearUser();
          }
        }
      } catch (err) {
        // Swallow abort errors — they are expected on unmount. Keep the
        // cached user for any other transient failure.
        if ((err as { name?: string })?.name === 'AbortError') return;
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    // (audit H-01) Listen for cross-tab role-revocation pushes. When
    // any other tab logs out or observes a forced session invalidation,
    // it broadcasts on `ROLE_REVOCATION_CHANNEL` and every other tab
    // hard-clears the cached user immediately, regardless of TTL.
    let channel: BroadcastChannel | null = null;
    const handleRevocation = () => {
      if (cancelled) return;
      setUser(null);
      clearUser();
    };
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel(ROLE_REVOCATION_CHANNEL);
        channel.addEventListener('message', handleRevocation);
      } catch {
        channel = null;
      }
    }
    // Fallback for environments without BroadcastChannel: listen to the
    // `storage` event, which fires in *other* tabs when sessionStorage /
    // localStorage is mutated — we use the user-key removal as the
    // signal.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === USER_KEY && e.newValue === null) {
        handleRevocation();
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (channel) {
        channel.removeEventListener('message', handleRevocation);
        channel.close();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials, options?: LoginOptions) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeaders('POST') },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message || `Login failed (${res.status})`
        );
      }

      const data = (await res.json()) as { user: User };

      setUser(data.user);
      persistUser(data.user);

      router.push(options?.redirectTo ?? '/dashboard');
    },
    [router]
  );

  const logout = useCallback(async () => {
    // Best-effort: unbind the wallet from the session *before* the
    // session cookie is dropped, otherwise the backend will reject the
    // SIWE logout as unauthenticated. Also broadcast a same-origin
    // custom event so the Web3Provider (which has access to wagmi's
    // `useDisconnect`) can tear down the wallet connection. This closes
    // H-02 — a logout that leaves the wallet bound would leak the
    // session-to-wallet link across accounts on a shared browser.
    try {
      await siweLogout();
    } catch {
      // Best-effort; proceed with logout.
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm:auth-logout'));
    }

    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { ...csrfHeaders('POST') },
        credentials: 'include',
      });
    } catch {
      // Best-effort logout call; proceed with local cleanup
    }

    setUser(null);
    clearUser();
    // (audit H-01) Push a role-revocation event to every other tab so
    // cached `user` state is cleared immediately. This closes the
    // window during which a stale role would otherwise remain visible
    // for up to USER_CACHE_TTL_MS.
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      try {
        const ch = new BroadcastChannel(ROLE_REVOCATION_CHANNEL);
        ch.postMessage({ type: 'logout', at: Date.now() });
        ch.close();
      } catch {
        // Ignore — the storage-event fallback in other tabs will fire
        // because `clearUser` removed the sessionStorage entry.
      }
    }
    router.push('/login');
  }, [router]);

  // ── Idle timeout (client-side UX layer; refresh rotation + server-
  //    side enforcement remain the backend's responsibility) ───────────
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);

  useEffect(() => {
    if (!user || typeof window === 'undefined') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Throttle reset calls so a stream of `mousemove` events (which can
    // fire hundreds of times per second) does not churn timers and
    // starve the event loop.
    let lastReset = 0;
    const RESET_THROTTLE_MS = 1000;
    const reset = () => {
      const now = Date.now();
      if (now - lastReset < RESET_THROTTLE_MS) return;
      lastReset = now;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void logoutRef.current();
      }, IDLE_TIMEOUT_MS);
    };
    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];
    activityEvents.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    // visibilitychange fires on `document`, not `window`.
    document.addEventListener('visibilitychange', reset);
    // Arm the initial timer regardless of the throttle.
    lastReset = Date.now();
    timer = setTimeout(() => {
      void logoutRef.current();
    }, IDLE_TIMEOUT_MS);
    return () => {
      if (timer) clearTimeout(timer);
      activityEvents.forEach((ev) => window.removeEventListener(ev, reset));
      document.removeEventListener('visibilitychange', reset);
    };
  }, [user]);

  const hasRole = useCallback(
    (requiredRole: Role): boolean => {
      if (!user) return false;
      return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[requiredRole];
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
