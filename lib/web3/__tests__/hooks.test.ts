import { describe, it, expect, vi } from 'vitest';

vi.mock('@rainbow-me/rainbowkit', () => ({
  getDefaultConfig: () => ({}),
}));

import {
  formatWei,
  formatTokenAmount,
  ChainMismatchError,
  assertContractConfigured,
  parseContributionAmount,
  parseWhitelistAmount,
  InvalidContributionError,
  MIN_CONTRIBUTION_WEI,
  MAX_CONTRIBUTION_WEI,
  SOFT_CAP_WEI,
} from '../hooks';

describe('ChainMismatchError', () => {
  it('reports expected and actual chain IDs', () => {
    const err = new ChainMismatchError(1, 11155111);
    expect(err.name).toBe('ChainMismatchError');
    expect(err.expected).toBe(1);
    expect(err.actual).toBe(11155111);
    expect(err.message).toContain('expected chain 1');
    expect(err.message).toContain('chain 11155111');
  });

  it('handles undefined actual chain', () => {
    const err = new ChainMismatchError(1, undefined);
    expect(err.message).toContain('not connected');
    expect(err.actual).toBeUndefined();
  });

  it('is an instance of Error', () => {
    const err = new ChainMismatchError(1, 5);
    expect(err).toBeInstanceOf(Error);
  });
});

describe('formatWei', () => {
  it('formats zero', () => {
    expect(formatWei(0n)).toBe('0');
  });

  it('formats 1 ETH', () => {
    expect(formatWei(1000000000000000000n)).toBe('1');
  });

  it('formats 0.5 ETH', () => {
    expect(formatWei(500000000000000000n)).toBe('0.5');
  });

  it('formats large amounts', () => {
    expect(formatWei(100000000000000000000n)).toBe('100');
  });

  it('formats small amounts', () => {
    const result = formatWei(1000000000000000n);
    expect(result).toBe('0.001');
  });
});

describe('formatTokenAmount', () => {
  it('formats zero', () => {
    expect(formatTokenAmount(0n)).toBe('0.0000');
  });

  it('formats 1 token (18 decimals)', () => {
    expect(formatTokenAmount(1000000000000000000n)).toBe('1.0000');
  });

  it('formats fractional tokens', () => {
    expect(formatTokenAmount(1500000000000000000n)).toBe('1.5000');
  });

  it('formats with custom decimals', () => {
    expect(formatTokenAmount(1000000n, 6)).toBe('1.0000');
  });

  it('formats large amounts', () => {
    expect(formatTokenAmount(1000000000000000000000000n)).toBe('1000000.0000');
  });
});

describe('assertContractConfigured', () => {
  it('throws when address is the zero address', () => {
    expect(() =>
      assertContractConfigured('0x0000000000000000000000000000000000000000', 'Token sale'),
    ).toThrow(/Token sale contract address is not configured/);
  });

  it('throws when address is the zero address in mixed case', () => {
    expect(() =>
      assertContractConfigured(
        '0x0000000000000000000000000000000000000000'.toUpperCase().replace('0X', '0x') as `0x${string}`,
        'Vesting',
      ),
    ).toThrow(/Vesting contract address is not configured/);
  });

  it('does not throw for a real address', () => {
    expect(() =>
      assertContractConfigured('0x1234567890123456789012345678901234567890', 'Token sale'),
    ).not.toThrow();
  });
});

describe('parseContributionAmount', () => {
  // Defaults: MIN=0.01 ETH, SOFT=10 ETH, MAX=100 ETH.
  it('rejects empty / non-string / whitespace input', () => {
    expect(() => parseContributionAmount('')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('   ')).toThrow(InvalidContributionError);
    // @ts-expect-error – exercising the runtime guard
    expect(() => parseContributionAmount(undefined)).toThrow(InvalidContributionError);
    // @ts-expect-error – exercising the runtime guard
    expect(() => parseContributionAmount(123)).toThrow(InvalidContributionError);
  });

  it('rejects malformed strings (sign, exponent, hex, NaN, multi-dot)', () => {
    expect(() => parseContributionAmount('-1')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('+1')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('1e3')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('0x1')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('one')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('1.2.3')).toThrow(InvalidContributionError);
  });

  it('rejects amounts with >18 fractional digits', () => {
    expect(() => parseContributionAmount('1.0000000000000000001')).toThrow(/decimals/);
  });

  it('rejects zero', () => {
    expect(() => parseContributionAmount('0')).toThrow(InvalidContributionError);
    expect(() => parseContributionAmount('0.0')).toThrow(InvalidContributionError);
  });

  it('rejects amounts below the minimum contribution', () => {
    expect(() => parseContributionAmount('0.001')).toThrow(/minimum/);
  });

  it('rejects amounts above the maximum contribution', () => {
    expect(() => parseContributionAmount('1000', { confirmedAboveSoftCap: true })).toThrow(/maximum/);
  });

  it('rejects amounts above the soft cap without confirmation', () => {
    // 25 > soft cap 10
    expect(() => parseContributionAmount('25')).toThrow(/confirm/);
  });

  it('accepts amounts above the soft cap when confirmed', () => {
    expect(parseContributionAmount('25', { confirmedAboveSoftCap: true })).toBe(
      25_000_000_000_000_000_000n,
    );
  });

  it('returns the parsed wei value for valid amounts', () => {
    expect(parseContributionAmount('1')).toBe(1_000_000_000_000_000_000n);
    expect(parseContributionAmount('0.5')).toBe(500_000_000_000_000_000n);
    expect(parseContributionAmount('0.01')).toBe(MIN_CONTRIBUTION_WEI);
  });

  it('exposes consistent bounds', () => {
    expect(MIN_CONTRIBUTION_WEI).toBeLessThan(SOFT_CAP_WEI);
    expect(SOFT_CAP_WEI).toBeLessThan(MAX_CONTRIBUTION_WEI);
  });
});

// ─── parseWhitelistAmount (audit M-07) ──────────────────────────────────────
describe('parseWhitelistAmount', () => {
  it('rejects scientific notation (1e18)', () => {
    expect(() => parseWhitelistAmount('1e18')).toThrow(InvalidContributionError);
  });

  it('rejects more than 18 fractional digits', () => {
    expect(() => parseWhitelistAmount('100.0000000000000000001')).toThrow(
      /too many decimals/,
    );
  });

  it('rejects leading whitespace', () => {
    expect(() => parseWhitelistAmount(' 1')).toThrow(InvalidContributionError);
  });

  it('rejects leading sign', () => {
    expect(() => parseWhitelistAmount('+1')).toThrow(InvalidContributionError);
    expect(() => parseWhitelistAmount('-1')).toThrow(InvalidContributionError);
  });

  it('rejects hex notation', () => {
    expect(() => parseWhitelistAmount('0xff')).toThrow(InvalidContributionError);
  });

  it('rejects empty / non-string input', () => {
    expect(() => parseWhitelistAmount('')).toThrow(/required/);
    expect(() => parseWhitelistAmount('   ')).toThrow(InvalidContributionError);
    // @ts-expect-error — runtime guard
    expect(() => parseWhitelistAmount(undefined)).toThrow(/required/);
    // @ts-expect-error — runtime guard
    expect(() => parseWhitelistAmount(123)).toThrow(/required/);
  });

  it('rejects zero', () => {
    expect(() => parseWhitelistAmount('0')).toThrow(/greater than 0/);
    expect(() => parseWhitelistAmount('0.0')).toThrow(/greater than 0/);
  });

  it('rejects amounts above the maximum cap', () => {
    expect(() => parseWhitelistAmount('1000000')).toThrow(/exceeds the maximum/);
  });

  it('accepts small amounts below the contribution MIN (admin caps may legitimately be smaller)', () => {
    // This is the deliberate divergence from parseContributionAmount.
    expect(parseWhitelistAmount('0.0001')).toBe(100_000_000_000_000n);
  });

  it('returns the parsed wei value for valid amounts', () => {
    expect(parseWhitelistAmount('1')).toBe(1_000_000_000_000_000_000n);
    expect(parseWhitelistAmount('0.5')).toBe(500_000_000_000_000_000n);
    expect(parseWhitelistAmount('10')).toBe(10_000_000_000_000_000_000n);
  });

  it('does not require confirmation above the soft cap', () => {
    // parseContributionAmount throws here without `confirmedAboveSoftCap`.
    // The whitelist path is admin-only and intentionally bypasses that
    // user-facing fat-finger guard.
    expect(parseWhitelistAmount('25')).toBe(25_000_000_000_000_000_000n);
  });
});
