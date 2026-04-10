/**
 * Centralized Content Security Policy configuration.
 *
 * Both middleware.ts and next.config.mjs import this module so the CSP
 * directives are defined in a single place, preventing accidental drift.
 */

export const CSP_HEADER_NAME = 'Content-Security-Policy';

export function buildCspHeaderValue(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
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

  const directives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' https: data:",
    `connect-src 'self' ${apiUrl} ${web3ConnectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    `report-uri ${reportUri}`,
  ];

  return directives.join('; ');
}
