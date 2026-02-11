/**
 * Transaction recording and history service.
 */

import {getSupabase} from './supabase';
import {SUPABASE_URL} from '../config/env';

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
 * Record a completed donation transaction.
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

  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  try {
    let needId: string | null = null;
    if (needSlug) {
      const {data} = await supabase
        .from('needs')
        .select('id')
        .eq('slug', needSlug)
        .single();
      needId = data?.id ?? null;
    }

    await supabase.from('transactions').insert({
      wallet_address: walletAddress,
      need_id: needId,
      tx_signature: txSignature,
      amount,
      note: note || null,
    });
  } catch {
    // Silently fail — transaction is already on-chain
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
