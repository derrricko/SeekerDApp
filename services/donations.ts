// v2 donation service — orchestrates the full USDC donation flow
//
// FLOW (two-phase to survive Seeker Activity destruction):
//   Phase 1 (MWA session — fast, no network submission):
//     authorize() → signMessages() → buildDonationTransaction() → signTransactions()
//   Phase 2 (after MWA session — Activity is stable):
//     sendRawTransaction() → confirmTransaction() → wallet-auth → record-donation
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
import {getSupabaseAccessToken, isTokenExpired, setSupabaseAccessToken} from './supabase';
import {authenticateWalletSignature} from './auth';
import {DonationCadence, DonationMode} from '../data/donationConfig';
import type {WalletSignResult} from '../components/providers/WalletProvider';

export interface DonationResult {
  txSignature: string;
  memo: DonationMemo;
  conversationId: string | null;
  donorWallet: string;
  /** Non-null when backend recording failed (tx is on-chain but not in Supabase). */
  recordError: string | null;
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
 * 1. MWA: authorize + sign auth message + sign transaction (NO submission)
 * 2. App: sendRawTransaction + confirmTransaction
 * 3. App: wallet-auth + record-donation
 *
 * This separation ensures all network-dependent work happens AFTER the MWA
 * session closes, surviving Android Activity destruction on Seeker.
 */
export async function executeDonationSeamless(
  connection: Connection,
  recipientWallet: string,
  recipientId: string,
  amountUSDC: number,
  cadence: DonationCadence,
  authorizeSignAndBuild: (
    buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
  ) => Promise<WalletSignResult>,
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
    let signedTransaction: Transaction | null = null;
    let authSignature = '';
    let authMessage = '';

    // --- Phase 1: MWA session (fast, no network submission) ---
    try {
      const walletResult = await authorizeSignAndBuild(async donor => {
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

      donorPubkey = walletResult.publicKey;
      signedTransaction = walletResult.signedTransaction;
      authSignature = walletResult.authSignature;
      authMessage = walletResult.authMessage;
    } catch (error: any) {
      // Handle FallbackTxSent — wallet already sent via signAndSendTransactions
      if (error?.name === 'FallbackTxSent') {
        donorPubkey = error.publicKey;
        const txSignature: string = error.txSignature;
        authSignature = error.authSignature;
        authMessage = error.authMessage;

        // Ensure auth is complete — skip if WalletProvider already set a valid token
        const fallbackToken = getSupabaseAccessToken();
        if (!fallbackToken || isTokenExpired(fallbackToken)) {
          try {
            const authResult = await authenticateWalletSignature({
              wallet: donorPubkey!.toBase58(),
              signature: authSignature,
              message: authMessage,
            });
            await setSupabaseAccessToken(authResult.token);
          } catch {
            // Auth may already be done from WalletProvider. Continue.
          }
        }

        // Skip to confirmation — wallet already submitted the tx
        return await confirmAndRecord(
          connection,
          txSignature,
          blockhash,
          lastValidBlockHeight,
          donorPubkey!,
          recipientId,
          causePreferences,
          donationMode,
          memo,
          amountUSDC,
        );
      }

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

    if (!donorPubkey || !memo || !signedTransaction) {
      return fail(
        'TX_SEND_FAILED',
        'Could not complete wallet transaction. Please try again.',
      );
    }

    // --- Phase 2: Submit the signed tx ourselves (Activity is stable) ---
    let txSignature: string;
    try {
      const serialized = signedTransaction.serialize();
      const sig = await connection.sendRawTransaction(serialized, {
        skipPreflight: false,
        maxRetries: 3,
      });
      txSignature = sig;
    } catch (error) {
      const txError = handleTransactionError(error);
      return {success: false, error: txError};
    }

    // --- Phase 3: Confirm + authenticate + record ---
    // Ensure wallet-auth is complete before recording.
    // WalletProvider already attempted auth after transact(). Only retry if
    // there is no valid token yet (avoids duplicate calls + replay guard rejection).
    const existingToken = getSupabaseAccessToken();
    if (!existingToken || isTokenExpired(existingToken)) {
      console.warn('[donation] No valid auth token — attempting wallet-auth...');
      try {
        const authResult = await authenticateWalletSignature({
          wallet: donorPubkey.toBase58(),
          signature: authSignature,
          message: authMessage,
        });
        await setSupabaseAccessToken(authResult.token);
      } catch (authErr) {
        const msg = authErr instanceof Error ? authErr.message : String(authErr);
        console.error('[donation] wallet-auth FAILED:', msg);
        // Continue — token may have been set by WalletProvider
      }
    }

    return await confirmAndRecord(
      connection,
      txSignature,
      blockhash,
      lastValidBlockHeight,
      donorPubkey,
      recipientId,
      causePreferences,
      donationMode,
      memo,
      amountUSDC,
    );
  } finally {
    donationMutex = false;
  }
}

/** Phase 3: Confirm on-chain, record in backend, return result. */
async function confirmAndRecord(
  connection: Connection,
  txSignature: string,
  blockhash: string,
  lastValidBlockHeight: number,
  donorPubkey: PublicKey,
  recipientId: string,
  causePreferences: string[],
  donationMode: DonationMode,
  memo: DonationMemo | null,
  amountUSDC: number,
): Promise<Result<DonationResult>> {
  // Confirm on-chain
  try {
    const confirmation = await connection.confirmTransaction(
      {signature: txSignature, blockhash, lastValidBlockHeight},
      'confirmed',
    );
    if (confirmation.value.err) {
      return fail(
        'TX_CONFIRM_FAILED',
        'Transaction was rejected on-chain. Your USDC was not transferred.',
      );
    }
  } catch (error) {
    // TX may still confirm — queue for safety
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

  // Record in backend
  let conversationId: string | null = null;
  let recordError: string | null = null;
  try {
    conversationId = await recordAndCreateConversationSecure(
      txSignature,
      recipientId,
      causePreferences,
      donationMode,
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[record-donation] FAILED:', errorMsg);
    recordError = errorMsg;

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
    memo: memo || {d: '', r: '', a: amountUSDC, t: 0, app: 'glimpse', tok: 'usdc'},
    conversationId,
    donorWallet: donorPubkey.toBase58(),
    recordError,
  });
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
