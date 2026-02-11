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

// Anchor program error codes (from programs/glimpse-escrow/src/error.rs)
const ANCHOR_ERROR_MAP: Record<number, string> = {
  6000: 'An internal error occurred. Please try again.', // Overflow
  6001: 'This need has already been fulfilled and disbursed.', // AlreadyDisbursed
  6002: 'Donation amount must be greater than zero.', // ZeroAmount
  6003: 'Unauthorized action.', // Unauthorized
};

/**
 * Classify a transaction/RPC error into a user-friendly message.
 */
export function handleTransactionError(err: any): string {
  const msg = err?.message ?? String(err);

  // Check for Anchor program custom error codes (format: "custom program error: 0x1770")
  const hexMatch = msg.match(/custom program error:\s*0x([0-9a-fA-F]+)/);
  if (hexMatch) {
    const code = parseInt(hexMatch[1], 16);
    if (ANCHOR_ERROR_MAP[code]) {
      return ANCHOR_ERROR_MAP[code];
    }
  }

  // Also check decimal error code format (some RPC responses use decimal)
  const decMatch = msg.match(/Custom\((\d+)\)/);
  if (decMatch) {
    const code = parseInt(decMatch[1], 10);
    if (ANCHOR_ERROR_MAP[code]) {
      return ANCHOR_ERROR_MAP[code];
    }
  }

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
