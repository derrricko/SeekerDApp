// Tests for USDC-specific error handling

import {handleTransactionError, handleMWAError} from '../utils/errors';

describe('handleTransactionError — USDC errors', () => {
  it('maps "Insufficient USDC" to INSUFFICIENT_USDC', () => {
    const error = new Error('Insufficient USDC balance');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_USDC');
    expect(result.recoverable).toBe(true);
  });

  it('maps "insufficient funds" to INSUFFICIENT_USDC', () => {
    const error = new Error('Transaction failed: insufficient funds');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_USDC');
    expect(result.recoverable).toBe(true);
  });

  it('maps "USDC token account not found" to USDC_ACCOUNT_NOT_FOUND', () => {
    const error = new Error('USDC token account not found');
    const result = handleTransactionError(error);
    expect(result.code).toBe('USDC_ACCOUNT_NOT_FOUND');
    expect(result.recoverable).toBe(false);
  });

  it('maps TokenAccountNotFoundError to USDC_ACCOUNT_NOT_FOUND', () => {
    const error = new Error('TokenAccountNotFoundError');
    const result = handleTransactionError(error);
    expect(result.code).toBe('USDC_ACCOUNT_NOT_FOUND');
    expect(result.recoverable).toBe(false);
  });

  it('maps "insufficient lamports" to INSUFFICIENT_SOL_FEES (tx fees)', () => {
    const error = new Error('insufficient lamports for rent');
    const result = handleTransactionError(error);
    expect(result.code).toBe('INSUFFICIENT_SOL_FEES');
    expect(result.recoverable).toBe(true);
  });

  it('maps "Blockhash not found" to TX_EXPIRED', () => {
    const error = new Error('Blockhash not found');
    const result = handleTransactionError(error);
    expect(result.code).toBe('TX_EXPIRED');
    expect(result.recoverable).toBe(true);
  });

  it('maps "block height exceeded" to TX_EXPIRED', () => {
    const error = new Error('block height exceeded');
    const result = handleTransactionError(error);
    expect(result.code).toBe('TX_EXPIRED');
    expect(result.recoverable).toBe(true);
  });

  it('maps simulation failure to SIMULATION_FAILED', () => {
    const error = new Error('Transaction simulation failed');
    const result = handleTransactionError(error);
    expect(result.code).toBe('SIMULATION_FAILED');
    expect(result.recoverable).toBe(true);
  });

  it('maps unknown error to TX_UNKNOWN', () => {
    const error = new Error('some random error');
    const result = handleTransactionError(error);
    expect(result.code).toBe('TX_UNKNOWN');
    expect(result.recoverable).toBe(true);
    expect(result.message).toContain('some random error');
  });

  it('handles non-Error objects', () => {
    const result = handleTransactionError('string error');
    expect(result.code).toBe('TX_UNKNOWN');
    expect(result.message).toContain('string error');
  });
});

describe('handleMWAError', () => {
  it('maps user declined to USER_DECLINED', () => {
    const error = new Error('ERROR_USER_DECLINED');
    const result = handleMWAError(error);
    expect(result.code).toBe('USER_DECLINED');
    expect(result.recoverable).toBe(true);
  });

  it('maps auth failed to AUTH_FAILED', () => {
    const error = new Error('ERROR_AUTHORIZATION_FAILED');
    const result = handleMWAError(error);
    expect(result.code).toBe('AUTH_FAILED');
    expect(result.recoverable).toBe(true);
  });

  it('maps wallet not found to WALLET_NOT_FOUND', () => {
    const error = new Error('ERROR_WALLET_NOT_FOUND');
    const result = handleMWAError(error);
    expect(result.code).toBe('WALLET_NOT_FOUND');
    expect(result.recoverable).toBe(false);
  });

  it('maps unknown MWA error to MWA_UNKNOWN', () => {
    const error = new Error('something unexpected');
    const result = handleMWAError(error);
    expect(result.code).toBe('MWA_UNKNOWN');
    expect(result.recoverable).toBe(true);
  });
});
