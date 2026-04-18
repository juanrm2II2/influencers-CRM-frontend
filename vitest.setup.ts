import '@testing-library/jest-dom/vitest';

// Provide a dummy WalletConnect project ID so that importing lib/web3/config
// during tests does not throw. Real value is only required in the browser.
process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??= 'test-project-id';
