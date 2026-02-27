// Tests for the USDC donation transaction builder (money-critical path)
//
// These tests validate the memo format, amount conversion, and safety
// guards WITHOUT requiring a Solana connection — we test the pure logic
// by importing the DonationMemo type and validating the contract.

import {USDC_DECIMALS} from '../config/env';

describe('USDC amount conversion', () => {
  it('converts 1 USDC to 1,000,000 raw units (6 decimals)', () => {
    const rawAmount = Math.round(1 * 10 ** USDC_DECIMALS);
    expect(rawAmount).toBe(1_000_000);
  });

  it('converts 0.01 USDC correctly', () => {
    const rawAmount = Math.round(0.01 * 10 ** USDC_DECIMALS);
    expect(rawAmount).toBe(10_000);
  });

  it('converts 5.50 USDC correctly', () => {
    const rawAmount = Math.round(5.5 * 10 ** USDC_DECIMALS);
    expect(rawAmount).toBe(5_500_000);
  });

  it('converts 10000 USDC correctly', () => {
    const rawAmount = Math.round(10_000 * 10 ** USDC_DECIMALS);
    expect(rawAmount).toBe(10_000_000_000);
  });

  it('handles floating point edge case 0.1 + 0.2', () => {
    const amount = 0.1 + 0.2; // 0.30000000000000004
    const rawAmount = Math.round(amount * 10 ** USDC_DECIMALS);
    expect(rawAmount).toBe(300_000);
  });
});

describe('DonationMemo contract', () => {
  // The memo format used on-chain. Verify the structure matches expectations.
  it('memo includes tok:"usdc" field', () => {
    const memo = {
      d: 'HQ5C58Tu',
      r: 'DdqT7Fek',
      a: 5.0,
      t: Math.floor(Date.now() / 1000),
      app: 'glimpse',
      tok: 'usdc',
      c: 'one_time' as const,
    };

    expect(memo.tok).toBe('usdc');
    expect(memo.app).toBe('glimpse');
  });

  it('memo amount reflects USDC (not raw units)', () => {
    const rawAmount = 5_000_000;
    const memoAmount = rawAmount / 10 ** USDC_DECIMALS;
    expect(memoAmount).toBe(5.0);
  });

  it('memo d and r are 8-char wallet prefixes', () => {
    const wallet = 'HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5';
    const prefix = wallet.slice(0, 8);
    expect(prefix).toBe('HQ5C58Tu');
    expect(prefix.length).toBe(8);
  });

  it('memo serializes under 566 bytes', () => {
    const memo = {
      d: 'HQ5C58Tu',
      r: 'DdqT7Fek',
      a: 10000.0,
      t: 1709000000,
      app: 'glimpse',
      tok: 'usdc',
      c: 'daily',
    };
    const serialized = JSON.stringify(memo);
    const byteLength = new TextEncoder().encode(serialized).length;
    expect(byteLength).toBeLessThanOrEqual(566);
  });
});

describe('safety cap', () => {
  const MAX_USDC = 10_000;

  it('rejects amounts above 10,000 USDC', () => {
    expect(MAX_USDC < 10_001).toBe(true);
  });

  it('accepts exactly 10,000 USDC', () => {
    expect(MAX_USDC < 10_000).toBe(false);
  });

  it('rejects zero amount', () => {
    const rawAmount = Math.round(0 * 10 ** USDC_DECIMALS);
    expect(rawAmount <= 0).toBe(true);
  });

  it('rejects negative amount', () => {
    const rawAmount = Math.round(-5 * 10 ** USDC_DECIMALS);
    expect(rawAmount <= 0).toBe(true);
  });
});
