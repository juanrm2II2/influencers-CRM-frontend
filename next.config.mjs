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

  // ── Smart-contract address validation (audit H-05) ───────────────────
  // A missing / malformed contract address used to silently fall back to
  // the zero address at module load — production builds would compile
  // and ship a UI that would prompt users to send ETH to 0x0…0 if any
  // runtime guard was bypassed. Refuse to build instead.
  for (const key of [
    'NEXT_PUBLIC_TOKEN_SALE_ADDRESS',
    'NEXT_PUBLIC_VESTING_ADDRESS',
  ]) {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `${key} is required for production builds. ` +
          'Set it to the deployed contract address (0x-prefixed 20-byte hex).'
      );
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(value)) {
      throw new Error(
        `${key} must be a valid 0x-prefixed 20-byte hex address. Received: "${value}".`
      );
    }
    if (/^0x0{40}$/.test(value)) {
      throw new Error(
        `${key} must not be the zero address. Configure the deployed contract address.`
      );
    }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Subresource Integrity (supply-chain hardening) ────────────────────
  // Next.js emits SRI `integrity` attributes on self-hosted <script> tags
  // built from the compiled chunks so that a tampered bundle delivered by
  // a compromised CDN will be rejected by the browser. Combined with the
  // strict `script-src 'self'` directive in lib/csp.ts (no inline, no
  // external scripts) this gives us strong script provenance guarantees.
  experimental: {
    sri: {
      algorithm: 'sha256',
    },
  },

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
      // ── SRI-protected static bundles (audit L-05) ────────────────────
      // The /_next/static/* chunks are content-hashed and emit an
      // `integrity` attribute on every <script> tag. Pin them to
      // long-lived immutable caching so a stale CDN edge cannot serve an
      // older hash after rotation (which would otherwise produce
      // SRI-mismatch errors that block the page from booting).
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
