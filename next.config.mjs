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
    // Build CSP value — report-only while tuning; swap to enforce later.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const cspValue = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https: data:",
      `connect-src 'self' ${apiUrl}`,
      "frame-ancestors 'none'",
    ].join('; ');

    // To enforce CSP, change the header key below from
    // "Content-Security-Policy-Report-Only" to "Content-Security-Policy".
    const cspHeaderName = 'Content-Security-Policy-Report-Only';

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
