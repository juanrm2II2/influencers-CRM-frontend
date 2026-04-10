import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CONTRACT_ADDRESSES, TOKEN_SALE_ABI, VESTING_ABI } from '../contracts';

describe('CONTRACT_ADDRESSES', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('returns zero-address when env vars are not set', () => {
    expect(CONTRACT_ADDRESSES.tokenSale).toBe(
      '0x0000000000000000000000000000000000000000'
    );
    expect(CONTRACT_ADDRESSES.vesting).toBe(
      '0x0000000000000000000000000000000000000000'
    );
  });
});

describe('TOKEN_SALE_ABI', () => {
  it('contains saleInfo function', () => {
    const saleInfo = TOKEN_SALE_ABI.find((e) => 'name' in e && e.name === 'saleInfo');
    expect(saleInfo).toBeDefined();
    expect(saleInfo).toHaveProperty('type', 'function');
    expect(saleInfo).toHaveProperty('stateMutability', 'view');
  });

  it('contains contribute function', () => {
    const contribute = TOKEN_SALE_ABI.find((e) => 'name' in e && e.name === 'contribute');
    expect(contribute).toBeDefined();
    expect(contribute).toHaveProperty('stateMutability', 'payable');
  });

  it('contains whitelist functions', () => {
    const add = TOKEN_SALE_ABI.find((e) => 'name' in e && e.name === 'addToWhitelist');
    const remove = TOKEN_SALE_ABI.find((e) => 'name' in e && e.name === 'removeFromWhitelist');
    const check = TOKEN_SALE_ABI.find((e) => 'name' in e && e.name === 'isWhitelisted');
    expect(add).toBeDefined();
    expect(remove).toBeDefined();
    expect(check).toBeDefined();
  });

  it('contains Contribution event', () => {
    const event = TOKEN_SALE_ABI.find((e) => 'name' in e && e.name === 'Contribution');
    expect(event).toBeDefined();
    expect(event).toHaveProperty('type', 'event');
  });
});

describe('VESTING_ABI', () => {
  it('contains getVestingSchedule function', () => {
    const fn = VESTING_ABI.find((e) => 'name' in e && e.name === 'getVestingSchedule');
    expect(fn).toBeDefined();
    expect(fn).toHaveProperty('stateMutability', 'view');
  });

  it('contains release function', () => {
    const fn = VESTING_ABI.find((e) => 'name' in e && e.name === 'release');
    expect(fn).toBeDefined();
    expect(fn).toHaveProperty('stateMutability', 'nonpayable');
  });

  it('contains releasableAmount function', () => {
    const fn = VESTING_ABI.find((e) => 'name' in e && e.name === 'releasableAmount');
    expect(fn).toBeDefined();
    expect(fn).toHaveProperty('stateMutability', 'view');
  });

  it('contains TokensReleased event', () => {
    const event = VESTING_ABI.find((e) => 'name' in e && e.name === 'TokensReleased');
    expect(event).toBeDefined();
    expect(event).toHaveProperty('type', 'event');
  });
});
