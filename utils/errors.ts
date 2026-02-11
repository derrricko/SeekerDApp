/**
 * Error handling utilities for MWA + transaction flows.
 *
 * Follows Solana Mobile error-handling patterns:
 * - Always handle ERROR_AUTHORIZATION_FAILED by clearing cached tokens
 * - Wrap transaction flows in safeTransaction for consistent UX
 */

// Known MWA error codes
const MWA_USER_DECLINED = 'ERROR_USER_DECLINED';
const MWA_AUTH_FAILED = 'ERROR_AUTHORIZATION_FAILED';
const MWA_NOT_FOUND = 'ERROR_WALLET_NOT_FOUND';

export interface TransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
}

/**
 * Classify an MWA error into a user-friendly message.
 * Returns `{clearAuth}` flag when cached auth should be invalidated.
 */
export function handleMWAError(err: any): {
  message: string;
  clearAuth: boolean;
} {
  const msg = err?.message ?? String(err);

  if (msg.includes(MWA_USER_DECLINED)) {
    return {message: 'Transaction was declined.', clearAuth: false};
  }

  if (msg.includes(MWA_AUTH_FAILED)) {
    return {
      message: 'Wallet authorization expired. Please reconnect.',
      clearAuth: true,
    };
  }

  if (msg.includes(MWA_NOT_FOUND)) {
    return {
      message: 'No wallet app found. Please install a Solana wallet.',
      clearAuth: false,
    };
  }

  return {message: msg, clearAuth: false};
}

/**
 * Classify a transaction/RPC error into a user-friendly message.
 */
export function handleTransactionError(err: any): string {
  const msg = err?.message ?? String(err);

  if (msg.includes('insufficient funds') || msg.includes('Insufficient')) {
    return 'Insufficient USDC balance for this donation.';
  }

  if (msg.includes('blockhash not found') || msg.includes('expired')) {
    return 'Transaction expired. Please try again.';
  }

  if (msg.includes('AccountNotFound')) {
    return 'USDC token account not found. Do you have USDC in your wallet?';
  }

  return msg || 'Transaction failed. Please try again.';
}

/**
 * Wrap an async transaction flow with standardized error handling.
 * Returns a clean result object instead of throwing.
 */
export async function safeTransaction(
  fn: () => Promise<string>,
): Promise<TransactionResult> {
  try {
    const signature = await fn();
    return {success: true, signature};
  } catch (err: any) {
    const mwaResult = handleMWAError(err);
    if (mwaResult.message !== (err?.message ?? String(err))) {
      // It was a recognized MWA error
      return {success: false, error: mwaResult.message};
    }
    // Fall through to transaction error handling
    return {success: false, error: handleTransactionError(err)};
  }
}
