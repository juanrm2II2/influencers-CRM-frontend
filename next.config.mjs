// ─── Build-time environment validation ─────────────────────────────────────
// In production builds, NEXT_PUBLIC_API_URL must be set and use HTTPS.
// This prevents accidental deployments without a proper backend URL.
if (process.env.NODE_ENV === 'production') {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required for production builds. ' +
      'Set it to your backend HTTPS URL (e.g. https://api.example.com).'
    );
  }
  if (!/^https:\/\//.test(apiUrl)) {
    throw new Error(
      `NEXT_PUBLIC_API_URL must use HTTPS in production. Received: "${apiUrl}".`
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
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      { protocol: 'https', hostname: '*.twimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: '*.tiktokcdn.com' },
    ],
  },

  // ─── Security headers (F-004) ──────────────────────────────────────────
  // CSP is applied by middleware.ts (via lib/csp.ts) on all HTML routes.
  // Only non-CSP security headers are configured here for static responses.
  async headers() {
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
        ],
      },
    ];
  },
};

export default nextConfig;
