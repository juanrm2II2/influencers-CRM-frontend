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

  // Rehydrate user from sessionStorage on mount.
  // SSR-safe: must run after hydration to avoid server/client mismatch.
  /* eslint-disable react-hooks/set-state-in-effect -- One-time post-hydration init from browser sessionStorage */
  useEffect(() => {
    const storedUser = loadUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/api/auth/login`, {
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
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
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
