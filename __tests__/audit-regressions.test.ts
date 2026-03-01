// Regression tests for pre-mainnet security audit findings (2026-02-28)
//
// HIGH-2: Float USDC amount matching — server-side memo amount validation
//         must tolerate 1-microUSDC rounding from IEEE 754 float arithmetic.
// LOW-3:  SOL vs USDC error classification — "insufficient lamports" must map
//         to INSUFFICIENT_SOL_FEES, not INSUFFICIENT_USDC.

import {USDC_DECIMALS} from '../config/env';
import {handleTransactionError} from '../utils/errors';

// ---------- HIGH-2: Float rounding tolerance ----------
//
// Mirror the server-side logic from record-donation/index.ts.
// Client: rawAmount = Math.round(amountUSDC * 10 ** 6)
// Memo:   a = rawAmount / 10 ** 6
// Server: memoAmountRaw = Math.round(memo.a * 10 ** 6)
// Audit fix: allow |memoAmountRaw - rawAmount| <= 1

function clientRawAmount(amountUSDC: number): bigint {
  return BigInt(Math.round(amountUSDC * 10 ** USDC_DECIMALS));
}

function memoAmount(rawAmount: bigint): number {
  return Number(rawAmount) / 10 ** USDC_DECIMALS;
}

function serverParseMemoToRaw(memoA: number): bigint {
  return BigInt(Math.round(memoA * 10 ** USDC_DECIMALS));
}

function amountMatchesWithTolerance(
  rawAmount: bigint,
  memoAmountRaw: bigint,
): boolean {
  const diff =
    memoAmountRaw > rawAmount
      ? memoAmountRaw - rawAmount
      : rawAmount - memoAmountRaw;
  return diff <= 1n;
}

function amountMatchesExact(rawAmount: bigint, memoAmountRaw: bigint): boolean {
  return memoAmountRaw === rawAmount;
}

describe('HIGH-2: USDC float rounding tolerance', () => {
  // Standard amounts — should pass with both exact and tolerant matching
  const standardAmounts = [1, 5, 10, 25, 50, 100, 500, 1000, 5000, 10000];

  it.each(standardAmounts)(
    'round-trips %d USDC exactly through memo',
    (amount: number) => {
      const raw = clientRawAmount(amount);
      const memo = memoAmount(raw);
      const serverRaw = serverParseMemoToRaw(memo);
      expect(amountMatchesWithTolerance(raw, serverRaw)).toBe(true);
      expect(amountMatchesExact(raw, serverRaw)).toBe(true);
    },
  );

  // Common decimal amounts
  const decimalAmounts = [0.01, 0.5, 1.5, 2.99, 9.99, 15.75, 99.99];

  it.each(decimalAmounts)(
    'round-trips %f USDC through memo within tolerance',
    (amount: number) => {
      const raw = clientRawAmount(amount);
      const memo = memoAmount(raw);
      const serverRaw = serverParseMemoToRaw(memo);
      expect(amountMatchesWithTolerance(raw, serverRaw)).toBe(true);
    },
  );

  // The specific IEEE 754 edge case: 0.1 + 0.2 = 0.30000000000000004
  it('tolerates 0.1 + 0.2 float imprecision', () => {
    const amount = 0.1 + 0.2; // 0.30000000000000004
    const raw = clientRawAmount(amount);
    const memo = memoAmount(raw);
    const serverRaw = serverParseMemoToRaw(memo);
    expect(amountMatchesWithTolerance(raw, serverRaw)).toBe(true);
  });

  // Simulate worst-case: memo amount drifts by exactly 1 microUSDC
  it('accepts 1-microUSDC drift (the tolerance boundary)', () => {
    const rawAmount = 5_000_000n; // 5 USDC
    const driftedMemo = 5_000_001n; // +1 microUSDC
    expect(amountMatchesWithTolerance(rawAmount, driftedMemo)).toBe(true);
  });

  it('accepts -1-microUSDC drift', () => {
    const rawAmount = 5_000_000n;
    const driftedMemo = 4_999_999n; // -1 microUSDC
    expect(amountMatchesWithTolerance(rawAmount, driftedMemo)).toBe(true);
  });

  // Reject drift > 1 microUSDC
  it('rejects 2-microUSDC drift', () => {
    const rawAmount = 5_000_000n;
    const driftedMemo = 5_000_002n;
    expect(amountMatchesWithTolerance(rawAmount, driftedMemo)).toBe(false);
  });

  // Verify the OLD exact-match logic WOULD have failed on edge cases
  it('exact match rejects 1-microUSDC drift (pre-fix behavior)', () => {
    const rawAmount = 5_000_000n;
    const driftedMemo = 5_000_001n;
    expect(amountMatchesExact(rawAmount, driftedMemo)).toBe(false);
  });
});

// ---------- SOL vs USDC error classification ----------
//
// Audit found that "insufficient lamports" must be classified as
// INSUFFICIENT_SOL_FEES (for tx fees), not INSUFFICIENT_USDC.
// This was already fixed in commit 853b7a8a but we add regression tests.

describe('SOL vs USDC error classification regression', () => {
  it('"insufficient lamports" → INSUFFICIENT_SOL_FEES, not USDC', () => {
    const error = new Error('insufficient lamports');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_SOL_FEES');
    expect(result.code).not.toBe('INSUFFICIENT_USDC');
  });

  it('"insufficient lamports for rent" → INSUFFICIENT_SOL_FEES', () => {
    const error = new Error('insufficient lamports for rent');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_SOL_FEES');
  });

  it('"Insufficient funds for rent" → INSUFFICIENT_SOL_FEES', () => {
    const error = new Error('Insufficient funds for rent');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_SOL_FEES');
  });

  it('"Insufficient USDC balance" → INSUFFICIENT_USDC (not SOL)', () => {
    const error = new Error('Insufficient USDC balance');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_USDC');
    expect(result.code).not.toBe('INSUFFICIENT_SOL_FEES');
  });

  it('"insufficient funds" (generic) → INSUFFICIENT_USDC', () => {
    const error = new Error('Transaction failed: insufficient funds');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_USDC');
  });
});
