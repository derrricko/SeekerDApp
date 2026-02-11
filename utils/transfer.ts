/**
 * USDC SPL Token Transfer Utility
 *
 * Builds a USDC transfer transaction and sends it via wallet-standard
 * signAndSendTransaction (from WalletProvider).
 *
 * When a `slug` is provided, routes through the Glimpse Escrow program.
 * Falls back to direct transfer if escrow fails or no slug given.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from '@solana/spl-token';
import {
  USDC_MINT,
  USDC_DECIMALS,
  RECIPIENT_WALLET,
} from '../config/env';
import {buildDonateTransaction} from './escrow';
import bs58 from 'bs58';

// Re-export for consumers
export {USDC_MINT, USDC_DECIMALS, RECIPIENT_WALLET};

/**
 * Convert a dollar amount to USDC base units (6 decimals)
 */
export function usdcToBaseUnits(amount: number): number {
  return Math.round(amount * 10 ** USDC_DECIMALS);
}

/**
 * Build a USDC transfer transaction.
 * Creates the recipient's associated token account if it doesn't exist.
 */
export async function buildUSDCTransferTransaction(
  connection: Connection,
  senderPublicKey: PublicKey,
  recipientPublicKey: PublicKey,
  amount: number,
): Promise<Transaction> {
  const senderATA = await getAssociatedTokenAddress(
    USDC_MINT,
    senderPublicKey,
  );
  const recipientATA = await getAssociatedTokenAddress(
    USDC_MINT,
    recipientPublicKey,
  );

  const instructions: TransactionInstruction[] = [];

  // Check if recipient ATA exists; if not, create it
  try {
    await getAccount(connection, recipientATA);
  } catch {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        senderPublicKey, // payer
        recipientATA,
        recipientPublicKey,
        USDC_MINT,
      ),
    );
  }

  // Add transfer instruction
  instructions.push(
    createTransferInstruction(
      senderATA,
      recipientATA,
      senderPublicKey,
      usdcToBaseUnits(amount),
    ),
  );

  const transaction = new Transaction();
  transaction.add(...instructions);

  const {blockhash} = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = senderPublicKey;

  return transaction;
}

/**
 * Execute a USDC transfer via wallet-standard signAndSendTransaction.
 *
 * When `slug` is provided, attempts the escrow program path first.
 * Falls back to direct transfer on escrow failure.
 *
 * Returns the transaction signature as a base58 string.
 */
export async function transferUSDC(
  connection: Connection,
  senderPublicKey: PublicKey,
  recipientPublicKey: PublicKey,
  amount: number,
  signAndSendTransaction: (transaction: Uint8Array) => Promise<Uint8Array>,
  slug?: string,
): Promise<string> {
  let transaction: Transaction;

  if (slug) {
    try {
      transaction = await buildDonateTransaction(
        connection,
        senderPublicKey,
        slug,
        amount,
      );
    } catch (escrowErr) {
      console.warn('Escrow build failed, falling back to direct transfer:', escrowErr);
      transaction = await buildUSDCTransferTransaction(
        connection,
        senderPublicKey,
        recipientPublicKey,
        amount,
      );
    }
  } else {
    transaction = await buildUSDCTransferTransaction(
      connection,
      senderPublicKey,
      recipientPublicKey,
      amount,
    );
  }

  // Serialize the transaction for wallet-standard
  const serialized = transaction.serialize({
    requireAllSignatures: false,
    verifySignatures: false,
  });

  const signatureBytes = await signAndSendTransaction(serialized);

  // Convert signature bytes to base58 string
  const signature = bs58.encode(Buffer.from(signatureBytes));

  // Confirm the transaction
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return signature;
}
