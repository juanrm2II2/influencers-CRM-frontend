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

// ─── Helpers ────────────────────────────────────────────────────────────────
// Tokens are now stored as httpOnly cookies set by the backend.
// Only the user profile (non-sensitive) is kept in sessionStorage for
// client-side UI state rehydration.

const USER_KEY = 'crm_user';
/**
 * Maximum age of the client-cached user profile. On load, any entry older
 * than this is discarded so stale PII cannot linger in sessionStorage
 * indefinitely — the authoritative source is always the `/api/auth/me`
 * response made on mount.
 */
const USER_CACHE_TTL_MS = 15 * 60 * 1000;
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

    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { accept: 'application/json' },
          cache: 'no-store',
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
      } catch {
        // keep cached user if any
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
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
