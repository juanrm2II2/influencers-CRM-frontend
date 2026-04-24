/**
 * Centralized Content Security Policy configuration.
 *
 * Both middleware.ts and next.config.mjs import this module so the CSP
 * directives are defined in a single place, preventing accidental drift.
 */

import { API_URL } from '@/lib/config';

export const CSP_HEADER_NAME = 'Content-Security-Policy';

export function buildCspHeaderValue(): string {
  const apiUrl = API_URL;
  const reportUri = process.env.CSP_REPORT_URI || '/api/csp-report';

  // Web3 wallet connectors (WalletConnect, RainbowKit) need WebSocket &
  // HTTPS access to relay servers and RPC endpoints.
  const web3ConnectSrc = [
    'https://*.walletconnect.com',
    'wss://*.walletconnect.com',
    'https://*.walletconnect.org',
    'wss://*.walletconnect.org',
    'https://*.infura.io',
    'https://*.alchemy.com',
    'wss://*.alchemy.com',
  ].join(' ');

  // KYC provider (SumSub) – the WebSDK communicates with SumSub's API
  // and loads its verification UI inside an iframe.
  const kycConnectSrc = [
    'https://*.sumsub.com',
    'wss://*.sumsub.com',
  ].join(' ');

  const kycFrameSrc = 'https://*.sumsub.com';

  const directives = [
    "default-src 'self'",
    // Scripts are limited to first-party, self-hosted chunks. Combined
    // with Next.js' `experimental.sri` setting (see next.config.mjs)
    // this gives every served <script> a cryptographic integrity hash
    // and blocks any third-party / inline / eval'd script by default —
    // a strong supply-chain defence.
    "script-src 'self'",
    "script-src-elem 'self'",
    "script-src-attr 'none'",
    "style-src 'self'",
    "img-src 'self' data: https://*.cdninstagram.com https://*.twimg.com https://yt3.ggpht.com https://p16-sign.tiktokcdn.com",
    `connect-src 'self' ${apiUrl} ${web3ConnectSrc} ${kycConnectSrc}`,
    `frame-src 'self' ${kycFrameSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    // Force any remaining http:// subresource URLs onto https:// at
    // fetch time. Belt-and-braces with the HSTS header in middleware.ts.
    'upgrade-insecure-requests',
    // Opt all script sinks into the Trusted Types API so a DOM-XSS payload
    // that reaches a sink (e.g. element.innerHTML) is rejected in-browser
    // unless it has been minted by an allowed Trusted Types policy.
    "require-trusted-types-for 'script'",
    `report-uri ${reportUri}`,
  ];

  return directives.join('; ');
}
