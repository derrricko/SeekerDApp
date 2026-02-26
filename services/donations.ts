// v2 donation service — orchestrates the full donation flow
//
// FLOW:
//   buildDonationTransaction() → signAndSendTransaction() → recordDonation() → createConversation()
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
import {addPendingConversation} from '../utils/retry';
import {getSupabase} from './supabase';
import {ADMIN_WALLET} from '../config/env';

export interface DonationResult {
  txSignature: string;
  memo: DonationMemo;
  conversationId: string | null;
}

/**
 * Execute a full donation:
 * 1. Build SOL + memo transaction
 * 2. Sign and send via MWA
 * 3. Record in Supabase + create conversation
 *
 * If step 3 fails, the tx is still on-chain — we queue a retry.
 */
export async function executeDonation(
  connection: Connection,
  donorPubkey: PublicKey,
  recipientWallet: string,
  recipientId: string,
  amountSOL: number,
  signAndSend: (tx: Transaction) => Promise<string>,
): Promise<Result<DonationResult>> {
  // 1. Build transaction
  let transaction;
  let memo: DonationMemo;
  try {
    const result = await buildDonationTransaction(
      connection,
      donorPubkey,
      recipientWallet,
      amountSOL,
    );
    transaction = result.transaction;
    memo = result.memo;
  } catch (error) {
    return fail('BUILD_FAILED', 'Could not build transaction. Please try again.');
  }

  // 2. Sign and send via MWA
  let txSignature: string;
  try {
    txSignature = await signAndSend(transaction);
  } catch (error) {
    const mwaError = handleMWAError(error);
    return {success: false, error: mwaError};
  }

  // 3. Record in Supabase + create conversation
  let conversationId: string | null = null;
  try {
    conversationId = await recordAndCreateConversation(
      txSignature,
      donorPubkey.toBase58(),
      recipientWallet,
      recipientId,
      amountSOL,
    );
  } catch (error) {
    // TX is on-chain but Supabase failed — queue retry
    await addPendingConversation({
      txSignature,
      donorWallet: donorPubkey.toBase58(),
      recipientId,
      amountSOL,
      timestamp: Date.now(),
    });
  }

  return ok({txSignature, memo, conversationId});
}

async function recordAndCreateConversation(
  txSignature: string,
  donorWallet: string,
  recipientWallet: string,
  recipientId: string,
  amountSOL: number,
): Promise<string> {
  const supabase = getSupabase();

  // Record the donation
  const {data: donation, error: donationError} = await supabase
    .from('donations')
    .insert({
      tx_signature: txSignature,
      donor_wallet: donorWallet,
      recipient_wallet: recipientWallet,
      recipient_id: recipientId,
      amount_sol: amountSOL,
    })
    .select('id')
    .single();

  if (donationError) {
    throw donationError;
  }

  // Create conversation
  const {data: conversation, error: convoError} = await supabase
    .from('conversations')
    .insert({
      donation_id: donation.id,
      donor_wallet: donorWallet,
      admin_wallet: ADMIN_WALLET,
    })
    .select('id')
    .single();

  if (convoError) {
    throw convoError;
  }

  // Insert welcome message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    sender_wallet: ADMIN_WALLET,
    body: `Your donation of ${amountSOL} SOL reached its destination. We'll share updates here as the impact unfolds.`,
  });

  return conversation.id;
}
