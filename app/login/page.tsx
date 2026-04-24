'use client';

import { Suspense, useState, useEffect, useMemo, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { sanitizeRedirectTarget } from '@/lib/redirect';

const DEFAULT_POST_LOGIN_PATH = '/dashboard';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Re-validate any `?redirect=` param supplied by middleware (or a
  // tampered bookmark). Unsafe values silently collapse to the default
  // post-login path so we can never send the browser off-origin.
  const redirectTarget = useMemo(
    () =>
      sanitizeRedirectTarget(
        searchParams?.get('redirect'),
        DEFAULT_POST_LOGIN_PATH,
      ),
    [searchParams],
  );

  // If the URL carried an *unsafe* `?redirect=` value, strip it so it can
  // never be re-read, copy-pasted, or logged. We detect the unsafe case
  // by: (a) a `redirect` param was present, (b) the sanitized target
  // collapsed to the default (meaning the raw value was rejected), and
  // (c) the raw value was not literally the default (otherwise it is
  // safe to leave in place). A safe value is preserved for back/forward.
  useEffect(() => {
    const raw = searchParams?.get('redirect');
    const fellBackToDefault = redirectTarget === DEFAULT_POST_LOGIN_PATH;
    const rawWasNotDefault = raw !== DEFAULT_POST_LOGIN_PATH;
    if (raw && fellBackToDefault && rawWasNotDefault) {
      router.replace('/login');
    }
  }, [searchParams, redirectTarget, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email, password }, { redirectTo: redirectTarget });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Influencer CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
