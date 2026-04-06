import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for Route Handlers and Server Components.
 * Uses the **anon** key so every request is subject to RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll can be called from a Server Component where cookies
            // are read-only. The middleware will refresh the session instead.
          }
        },
      },
    },
  );
}
