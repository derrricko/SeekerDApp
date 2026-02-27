// v2 donation service — orchestrates the full USDC donation flow
//
// FLOW:
//   buildDonationTransaction()  (SPL USDC transferChecked + Memo)
//      → signAndSendTransaction()  via MWA
//      → confirmTransaction() on-chain
//      → secure record-donation edge function (server verifies SPL tx)
//                                                              ↓ (on failure)
//                                                        addPendingConversation()

import {Connection, PublicKey, Transaction} from '@solana/web3.js';
import {buildDonationTransaction, DonationMemo} from '../utils/transfer';
import {
  Result,
  ok,
  fail,
  handleMWAError,
  handleTransactionError,
} from '../utils/errors';
import {
  addPendingConversation,
  getPendingConversations,
  removePendingConversation,
} from '../utils/retry';
import {SUPABASE_ANON_KEY, SUPABASE_URL} from '../config/env';
import {getSupabaseAccessToken} from './supabase';
import {DonationCadence, DonationMode} from '../data/donationConfig';

export interface DonationResult {
  txSignature: string;
  memo: DonationMemo;
  conversationId: string | null;
}

/**
 * Execute a full USDC donation:
 * 1. Build SPL USDC transferChecked + Memo transaction
 * 2. Sign and send via MWA
 * 3. Confirm on-chain settlement
 * 4. Record via secure backend verifier + create conversation
 *
 * If step 4 fails, the tx is still on-chain — we queue a retry.
 */
export async function executeDonation(
  connection: Connection,
  donorPubkey: PublicKey,
  recipientWallet: string,
  recipientId: string,
  amountUSDC: number,
  cadence: DonationCadence,
  signAndSend: (tx: Transaction) => Promise<string>,
  causePreferences: string[] = [],
  donationMode: DonationMode = 'solo',
): Promise<Result<DonationResult>> {
  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    return fail('INVALID_AMOUNT', 'Donation amount must be greater than 0');
  }

  // 1. Build USDC SPL transaction
  let transaction;
  let memo: DonationMemo;
  let blockhash = '';
  let lastValidBlockHeight = 0;
  try {
    const result = await buildDonationTransaction(
      connection,
      donorPubkey,
      recipientWallet,
      amountUSDC,
      cadence,
    );
    transaction = result.transaction;
    memo = result.memo;
    blockhash = result.blockhash;
    lastValidBlockHeight = result.lastValidBlockHeight;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    // Surface specific pre-flight errors (insufficient balance, no ATA, etc.)
    if (
      msg.includes('Insufficient') ||
      msg.includes('token account not found') ||
      msg.includes('exceeds maximum')
    ) {
      return fail('BUILD_FAILED', msg);
    }
    return fail(
      'BUILD_FAILED',
      'Could not build transaction. Please try again.',
    );
  }

  // 2. Sign and send via MWA
  let txSignature: string;
  try {
    txSignature = await signAndSend(transaction);
  } catch (error) {
    // Check for transaction-level errors first (insufficient SOL, expired, etc.)
    // then fall back to MWA-specific error handling
    const txError = handleTransactionError(error);
    if (txError.code !== 'TX_UNKNOWN') {
      return {success: false, error: txError};
    }
    const mwaError = handleMWAError(error);
    return {success: false, error: mwaError};
  }

  // 3. Confirm on-chain settlement before showing success
  try {
    const confirmation = await connection.confirmTransaction(
      {
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed',
    );

    if (confirmation.value.err) {
      return fail(
        'TX_CONFIRM_FAILED',
        'Transaction failed during confirmation. No funds were settled.',
      );
    }
  } catch (error) {
    const txError = handleTransactionError(error);
    return {success: false, error: txError};
  }

  // 4. Secure server-side record + conversation creation
  let conversationId: string | null = null;
  try {
    conversationId = await recordAndCreateConversationSecure(
      txSignature,
      recipientId,
      causePreferences,
      donationMode,
    );
  } catch (error) {
    // TX is on-chain but Supabase failed — queue retry
    await addPendingConversation({
      txSignature,
      donorWallet: donorPubkey.toBase58(),
      recipientId,
      amountUSDC,
      causePreferences,
      donationMode,
      timestamp: Date.now(),
    });
  }

  return ok({txSignature, memo, conversationId});
}

export async function retryPendingConversations(): Promise<void> {
  const pending = await getPendingConversations();
  if (pending.length === 0) {
    return;
  }

  for (const item of pending) {
    try {
      await recordAndCreateConversationSecure(
        item.txSignature,
        item.recipientId,
        item.causePreferences || [],
        (item.donationMode as DonationMode) || 'solo',
      );
      await removePendingConversation(item.txSignature);
    } catch (error) {
      // Keep item in queue for next retry cycle.
    }
  }
}

async function recordAndCreateConversationSecure(
  txSignature: string,
  recipientId: string,
  causePreferences: string[],
  donationMode: DonationMode,
): Promise<string> {
  const token = getSupabaseAccessToken();
  if (!token) {
    throw new Error('Wallet auth token missing');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/record-donation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      txSignature,
      recipientId,
      causePreferences,
      donationMode,
    }),
  });

  const payload = await safeParseJson(response);
  if (!response.ok) {
    const errorMessage =
      typeof payload?.error === 'string'
        ? payload.error
        : 'Could not record donation in backend';
    throw new Error(errorMessage);
  }

  if (typeof payload?.conversationId !== 'string') {
    throw new Error('Backend did not return a conversation id');
  }

  return payload.conversationId;
}

async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
