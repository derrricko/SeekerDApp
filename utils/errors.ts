// v2 error handling — MWA + USDC transaction errors

// ---------- Result type ----------

export type AppError = {
  code: string;
  message: string;
  recoverable: boolean;
};

export type Result<T> =
  | {success: true; data: T}
  | {success: false; error: AppError};

export function ok<T>(data: T): Result<T> {
  return {success: true, data};
}

export function fail<T>(
  code: string,
  message: string,
  recoverable = true,
): Result<T> {
  return {success: false, error: {code, message, recoverable}};
}

// ---------- MWA errors ----------

const MWA_USER_DECLINED = 'ERROR_USER_DECLINED';
const MWA_AUTH_FAILED = 'ERROR_AUTHORIZATION_FAILED';
const MWA_NOT_FOUND = 'ERROR_WALLET_NOT_FOUND';

export function handleMWAError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes(MWA_USER_DECLINED)) {
    return {
      code: 'USER_DECLINED',
      message: 'Transaction cancelled. You can try again when ready.',
      recoverable: true,
    };
  }

  if (message.includes(MWA_AUTH_FAILED)) {
    return {
      code: 'AUTH_FAILED',
      message: 'Wallet authorization expired. Please reconnect your wallet.',
      recoverable: true,
    };
  }

  if (message.includes(MWA_NOT_FOUND)) {
    return {
      code: 'WALLET_NOT_FOUND',
      message: 'No Solana wallet found. Install a wallet app to continue.',
      recoverable: false,
    };
  }

  return {
    code: 'MWA_UNKNOWN',
    message: `Wallet error: ${message}`,
    recoverable: true,
  };
}

// ---------- Transaction errors ----------

export function handleTransactionError(error: unknown): AppError {
  const message = error instanceof Error ? error.message : String(error);

  // SOL-specific errors first (rent, lamports) before generic "Insufficient"
  if (
    message.includes('insufficient lamports') ||
    message.includes('Insufficient funds for rent')
  ) {
    return {
      code: 'INSUFFICIENT_SOL_FEES',
      message:
        'Not enough SOL in your wallet to cover transaction fees. Add a small amount of SOL.',
      recoverable: true,
    };
  }

  if (
    message.includes('Insufficient USDC') ||
    message.includes('insufficient funds')
  ) {
    return {
      code: 'INSUFFICIENT_USDC',
      message: 'Not enough USDC in your wallet for this donation.',
      recoverable: true,
    };
  }

  if (
    message.includes('USDC token account not found') ||
    message.includes('TokenAccountNotFoundError')
  ) {
    return {
      code: 'USDC_ACCOUNT_NOT_FOUND',
      message: 'No USDC found in your wallet. Add USDC to donate.',
      recoverable: false,
    };
  }

  if (
    message.includes('Blockhash not found') ||
    message.includes('block height exceeded')
  ) {
    return {
      code: 'TX_EXPIRED',
      message: 'Transaction expired. Please try again.',
      recoverable: true,
    };
  }

  if (message.includes('Transaction simulation failed')) {
    return {
      code: 'SIMULATION_FAILED',
      message: 'Transaction could not be processed. Please try again.',
      recoverable: true,
    };
  }

  return {
    code: 'TX_UNKNOWN',
    message: `Transaction failed: ${message}`,
    recoverable: true,
  };
}
