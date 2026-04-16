import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@rainbow-me/rainbowkit', () => ({
  getDefaultConfig: () => ({}),
}));

describe('EXPECTED_CHAIN_ID', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to mainnet (1) when env var is not set', async () => {
    delete process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID;
    const { EXPECTED_CHAIN_ID } = await import('../config');
    expect(EXPECTED_CHAIN_ID).toBe(1);
  });

  it('reads from NEXT_PUBLIC_EXPECTED_CHAIN_ID env var', async () => {
    process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID = '11155111';
    const { EXPECTED_CHAIN_ID } = await import('../config');
    expect(EXPECTED_CHAIN_ID).toBe(11155111);
  });

  it('falls back to mainnet for invalid env var values', async () => {
    process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID = 'not-a-number';
    const { EXPECTED_CHAIN_ID } = await import('../config');
    expect(EXPECTED_CHAIN_ID).toBe(1);
  });

  it('falls back to mainnet for zero', async () => {
    process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID = '0';
    const { EXPECTED_CHAIN_ID } = await import('../config');
    expect(EXPECTED_CHAIN_ID).toBe(1);
  });

  it('falls back to mainnet for negative values', async () => {
    process.env.NEXT_PUBLIC_EXPECTED_CHAIN_ID = '-1';
    const { EXPECTED_CHAIN_ID } = await import('../config');
    expect(EXPECTED_CHAIN_ID).toBe(1);
  });
});
