/**
 * USDC SPL Token Transfer Utility
 *
 * Handles building and sending USDC transfer transactions via MWA.
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
  transact,
  Web3MobileWallet,
} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {
  APP_IDENTITY,
  SOLANA_CLUSTER,
  USDC_MINT,
  USDC_DECIMALS,
  RECIPIENT_WALLET,
} from '../config/env';

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
 * Execute a USDC transfer via Mobile Wallet Adapter.
 * Returns the transaction signature on success.
 */
export async function transferUSDC(
  connection: Connection,
  senderPublicKey: PublicKey,
  recipientPublicKey: PublicKey,
  amount: number,
): Promise<string> {
  const transaction = await buildUSDCTransferTransaction(
    connection,
    senderPublicKey,
    recipientPublicKey,
    amount,
  );

  const txSignature = await transact(
    async (wallet: Web3MobileWallet) => {
      // Authorize / reauthorize the session
      const authResult = await wallet.authorize({
        cluster: SOLANA_CLUSTER,
        identity: APP_IDENTITY,
      });

      // Sign and send the transaction
      const signedTransactions = await wallet.signAndSendTransactions({
        transactions: [transaction],
      });

      return signedTransactions[0];
    },
  );

  // Confirm the transaction
  const latestBlockhash = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature: txSignature,
    blockhash: latestBlockhash.blockhash,
    lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
  });

  return txSignature;
}
