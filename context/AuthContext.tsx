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
import { createClient } from '@/lib/supabase/client';
import type { User, LoginCredentials, Role } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────
// Only the user profile (non-sensitive) is kept in sessionStorage for
// client-side UI state rehydration between navigations.
// Auth tokens are NOT stored here; Supabase manages them in httpOnly cookies.

const USER_KEY = 'crm_user';

/** Persist non-sensitive display fields only (no tokens or secrets). */
function persistUser(user: User): void {
  try {
    const { id, name, role } = user;
    sessionStorage.setItem(USER_KEY, JSON.stringify({ id, email: user.email, name, role }));
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

// ─── Map Supabase auth user → app User ──────────────────────────────────────

function toAppUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name: (supabaseUser.user_metadata?.name as string) ?? supabaseUser.email ?? '',
    role: (supabaseUser.user_metadata?.role as Role) ?? 'viewer',
  };
}

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate: first from sessionStorage (instant), then verify with Supabase.
  /* eslint-disable react-hooks/set-state-in-effect -- One-time post-hydration init */
  useEffect(() => {
    const storedUser = loadUser();
    if (storedUser) {
      setUser(storedUser);
    }

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: sbUser } }) => {
      if (sbUser) {
        const appUser = toAppUser(sbUser);
        setUser(appUser);
        persistUser(appUser);
      } else {
        setUser(null);
        clearUser();
      }
      setIsLoading(false);
    });

    // Listen for auth state changes (e.g. token refresh, sign out in another tab)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const appUser = toAppUser(session.user);
        setUser(appUser);
        persistUser(appUser);
      } else {
        setUser(null);
        clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      const appUser = toAppUser(data.user);
      setUser(appUser);
      persistUser(appUser);

      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    const supabase = createClient();

    try {
      await supabase.auth.signOut();
    } catch {
      // Best-effort; proceed with local cleanup
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
    [user],
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
