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
import type { User, AuthTokens, LoginCredentials, Role } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'crm_tokens';
const USER_KEY = 'crm_user';
const COOKIE_NAME = 'crm_access_token';

function persistTokens(tokens: AuthTokens): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    // Also set an HTTP cookie so the Next.js edge middleware can guard routes.
    // The cookie is SameSite=Strict to mitigate CSRF (F-006).
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(tokens.accessToken)}; path=/; SameSite=Strict; Secure`;
  } catch {
    // Storage full or unavailable – continue without persistence
  }
}

function loadTokens(): AuthTokens | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    return null;
  }
}

function clearTokens(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    // Remove the route-guard cookie
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict; Secure`;
  } catch {
    // Ignore
  }
}

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

// ─── Context type ──────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
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
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from sessionStorage on mount
  useEffect(() => {
    const storedTokens = loadTokens();
    const storedUser = loadUser();
    if (storedTokens && storedUser) {
      setTokens(storedTokens);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message || `Login failed (${res.status})`
        );
      }

      const data = (await res.json()) as {
        user: User;
        accessToken: string;
        refreshToken: string;
      };

      const newTokens: AuthTokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      };

      setUser(data.user);
      setTokens(newTokens);
      persistTokens(newTokens);
      persistUser(data.user);

      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    clearTokens();
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
        tokens,
        isAuthenticated: !!user && !!tokens,
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
