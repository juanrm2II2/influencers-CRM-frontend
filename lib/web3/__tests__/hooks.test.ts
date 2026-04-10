import { describe, it, expect } from 'vitest';
import { formatWei, formatTokenAmount } from '../hooks';

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
