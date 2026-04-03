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
};

export default nextConfig;
