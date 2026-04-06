import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client.
 * Uses the **anon** (public) key so every request is subject to RLS.
 * The user's JWT is managed automatically via cookies by @supabase/ssr.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
