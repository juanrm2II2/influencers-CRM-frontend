'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User, LoginCredentials, Role } from '@/types';
import { csrfHeaders } from '@/lib/csrf';
import { API_URL } from '@/lib/config';

// ─── Helpers ────────────────────────────────────────────────────────────────
// Tokens are now stored as httpOnly cookies set by the backend.
// Only the user profile (non-sensitive) is kept in sessionStorage for
// client-side UI state rehydration.

const USER_KEY = 'crm_user';

function persistUser(user: User): void {
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore
  }
}

function loadUser(): User | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
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

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate user from sessionStorage on mount, then verify against the
  // backend so that a tampered sessionStorage role is overridden by the
  // server-authoritative value (F-02 hardening).
  // SSR-safe: must run after hydration to avoid server/client mismatch.
  useEffect(() => {
    const controller = new AbortController();

    const storedUser = loadUser();
    if (storedUser) {
      setUser(storedUser);
    }

    // Verify session with the backend to get the server-authoritative role.
    // On success the cached profile is replaced; on 401 the session is
    // cleared; on network error the cached value is kept as a graceful
    // degradation (on-chain enforcement is the ultimate guard).
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (res.ok) {
          const data = (await res.json()) as { user: User };
          setUser(data.user);
          persistUser(data.user);
        } else if (res.status === 401) {
          // Token expired or invalid – clear cached state
          setUser(null);
          clearUser();
        }
        // Other status codes: keep cached user (server transient error)
      } catch {
        // Network error or aborted – keep cached user for offline tolerance
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    })();

    return () => controller.abort();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
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

      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(async () => {
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
