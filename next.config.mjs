// ─── Build-time environment validation ─────────────────────────────────────
// In production builds, Supabase environment variables must be set.
if (process.env.NODE_ENV === 'production') {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL is required for production builds. ' +
      'Set it to your Supabase project URL (e.g. https://<ref>.supabase.co).'
    );
  }
  if (!/^https:\/\//.test(supabaseUrl)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must use HTTPS in production. Received: "${supabaseUrl}".`
    );
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY is required for production builds. ' +
      'Set it to the anon (public) key from your Supabase dashboard.'
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Profile images are served from various social media CDNs (TikTok, Instagram,
    // YouTube, Twitter) whose hostnames are dynamic and cannot be pre-enumerated.
    // Restrict to HTTPS only to mitigate mixed-content and cleartext risks.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // ─── Security headers (F-004) ──────────────────────────────────────────
  async headers() {
    // Build CSP value — enforced mode.
    // All Supabase services (REST, Auth, Storage, Functions) use the project URL.
    // Realtime uses WebSockets, so include the wss:// variant.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseWs = supabaseUrl.replace(/^https:\/\//, 'wss://');
    const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';
    const cspValue = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' https: data:",
      `connect-src 'self' ${supabaseUrl} ${supabaseWs}`,
      "frame-ancestors 'none'",
      `report-uri ${reportUri}`,
    ].join('; ');

    const cspHeaderName = 'Content-Security-Policy';

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: cspHeaderName, value: cspValue },
        ],
      },
    ];
  },
};

export default nextConfig;
