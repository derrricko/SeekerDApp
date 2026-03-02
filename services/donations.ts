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
import {getSupabaseAccessToken, isTokenExpired} from './supabase';
import {DonationCadence, DonationMode} from '../data/donationConfig';

export interface DonationResult {
  txSignature: string;
  memo: DonationMemo;
  conversationId: string | null;
  donorWallet: string;
}

/** Thrown when the server returns 4xx — permanent failure, do not retry. */
class PermanentRecordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermanentRecordError';
  }
}

/** Thrown when the server returns 403 — wallet lacks SGT (Seeker Genesis Token). */
class SGTVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SGTVerificationError';
  }
}

// Service-level concurrency guard — prevents two donations in-flight simultaneously
let donationMutex = false;

/**
 * Execute donation in one wallet session:
 * authorize + wallet-auth signature + tx signature happen in a single MWA flow.
 */
export async function executeDonationSeamless(
  connection: Connection,
  recipientWallet: string,
  recipientId: string,
  amountUSDC: number,
  cadence: DonationCadence,
  authorizeAndSignAndSend: (
    buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
  ) => Promise<{publicKey: PublicKey; signature: string}>,
  causePreferences: string[] = [],
  donationMode: DonationMode = 'solo',
): Promise<Result<DonationResult>> {
  if (donationMutex) {
    return fail(
      'DONATION_IN_PROGRESS',
      'A donation is already being processed',
    );
  }
  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    return fail('INVALID_AMOUNT', 'Donation amount must be greater than 0');
  }

  donationMutex = true;
  try {
    let memo: DonationMemo | null = null;
    let blockhash = '';
    let lastValidBlockHeight = 0;
    let donorPubkey: PublicKey | null = null;
    let txSignature = '';

    try {
      const signed = await authorizeAndSignAndSend(async donor => {
        donorPubkey = donor;
        const built = await buildDonationTransaction(
          connection,
          donor,
          recipientWallet,
          amountUSDC,
          cadence,
        );
        memo = built.memo;
        blockhash = built.blockhash;
        lastValidBlockHeight = built.lastValidBlockHeight;
        return built.transaction;
      });

      donorPubkey = signed.publicKey;
      txSignature = signed.signature;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (
        msg.includes('Insufficient') ||
        msg.includes('token account not found') ||
        msg.includes('exceeds maximum') ||
        msg.includes('Could not build transaction') ||
        msg.includes('Donation amount')
      ) {
        return fail('BUILD_FAILED', msg);
      }

      const txError = handleTransactionError(error);
      if (txError.code !== 'TX_UNKNOWN') {
        return {success: false, error: txError};
      }

      const mwaError = handleMWAError(error);
      if (mwaError.code !== 'MWA_UNKNOWN') {
        return {success: false, error: mwaError};
      }

      return fail('TX_SEND_FAILED', 'Could not complete wallet transaction.');
    }

    if (!donorPubkey || !memo) {
      return fail(
        'TX_SEND_FAILED',
        'Could not complete wallet transaction. Please try again.',
      );
    }

    // Confirm on-chain — if this fails, tx may still land. Queue for retry.
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
          'Transaction was rejected on-chain. Your USDC was not transferred.',
        );
      }
    } catch (error) {
      // TX may still confirm — queue for safety before returning error
      await addPendingConversation({
        txSignature,
        donorWallet: donorPubkey.toBase58(),
        recipientId,
        amountUSDC,
        causePreferences,
        donationMode,
        timestamp: Date.now(),
      });
      const txError = handleTransactionError(error);
      return {success: false, error: txError};
    }

    let conversationId: string | null = null;
    try {
      conversationId = await recordAndCreateConversationSecure(
        txSignature,
        recipientId,
        causePreferences,
        donationMode,
      );
    } catch (error) {
      // SGT failure = device not authorized. Surface to user, don't queue retry.
      if (error instanceof SGTVerificationError) {
        return fail(
          'SGT_REQUIRED',
          'This app requires a Solana Seeker device. Your donation was sent on-chain but cannot be recorded.',
        );
      }
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

    return ok({
      txSignature,
      memo,
      conversationId,
      donorWallet: donorPubkey.toBase58(),
    });
  } finally {
    donationMutex = false;
  }
}

// Max age for retry queue items — Solana RPC nodes only keep ~2 epochs of
// finalized history, so very old transactions won't be fetchable server-side.
const RETRY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function retryPendingConversations(): Promise<void> {
  // Skip retries if JWT is expired — server will reject all requests
  const token = getSupabaseAccessToken();
  if (!token || isTokenExpired(token)) {
    return;
  }

  const pending = await getPendingConversations();
  if (pending.length === 0) {
    return;
  }

  const now = Date.now();
  for (const item of pending) {
    // Evict stale items — RPC can't fetch old transactions
    if (now - item.timestamp > RETRY_MAX_AGE_MS) {
      await removePendingConversation(item.txSignature);
      continue;
    }

    try {
      await recordAndCreateConversationSecure(
        item.txSignature,
        item.recipientId,
        item.causePreferences,
        item.donationMode,
      );
      await removePendingConversation(item.txSignature);
    } catch (error) {
      // 4xx permanent failures — remove from queue, will never succeed
      if (error instanceof PermanentRecordError) {
        await removePendingConversation(item.txSignature);
      }
      // Transient errors (5xx, network) — keep in queue for next retry cycle.
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/record-donation`, {
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
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await safeParseJson(response);
  if (!response.ok) {
    const errorMessage =
      typeof payload?.error === 'string'
        ? payload.error
        : 'Could not record donation in backend';
    // 403 = SGT verification failed — wallet is not on a Seeker device
    if (response.status === 403) {
      throw new SGTVerificationError(errorMessage);
    }
    // 401 = auth expired — transient, user can re-auth and retry
    // 400/422 = validation failure — permanent, will never succeed
    if (
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 401
    ) {
      throw new PermanentRecordError(errorMessage);
    }
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
