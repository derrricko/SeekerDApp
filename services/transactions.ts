/**
 * Transaction recording and history service.
 *
 * Recording goes through the `record-transaction` edge function, which
 * verifies the transaction on-chain before inserting. This prevents
 * fabricated tx signatures from being stored.
 */

import {getSupabase} from './supabase';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config/env';

export interface TransactionRecord {
  id: string;
  wallet_address: string;
  need_id: string | null;
  tx_signature: string;
  amount: number;
  note: string | null;
  created_at: string;
}

/**
 * Record a completed donation transaction via server-side verification.
 *
 * Calls the `record-transaction` edge function which fetches the
 * transaction from Solana RPC, verifies the signer and USDC involvement,
 * then inserts into the `transactions` table with the service-role client.
 */
export async function recordTransaction(
  walletAddress: string,
  txSignature: string,
  amount: number,
  needSlug?: string,
  note?: string,
): Promise<void> {
  if (!SUPABASE_URL) {
    return;
  }

  try {
    // Get the auth token from the Supabase session (set during SIWS auth)
    const supabase = getSupabase();
    const session = supabase
      ? (await supabase.auth.getSession()).data.session
      : null;
    const token = session?.access_token;

    const res = await fetch(`${SUPABASE_URL}/functions/v1/record-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      body: JSON.stringify({
        tx_signature: txSignature,
        wallet_address: walletAddress,
        need_slug: needSlug,
        note,
      }),
    });

    if (!res.ok) {
      console.warn('Failed to record transaction:', await res.text());
    }
  } catch {
    // Fire-and-forget — transaction is already on-chain
  }
}

/**
 * Fetch transaction history for a given wallet.
 */
export async function fetchMyTransactions(
  walletAddress: string,
): Promise<TransactionRecord[]> {
  if (!SUPABASE_URL) {
    return [];
  }

  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  try {
    const {data, error} = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_address', walletAddress)
      .order('created_at', {ascending: false});

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}
