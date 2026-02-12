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
  needSlug?: string,
  note?: string,
): Promise<void> {
  if (!SUPABASE_URL) {
    return;
  }

  // Get the auth token from the Supabase session
  const supabase = getSupabase();
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;
  const token = session?.access_token;

  if (!token) {
    console.warn('No auth session — skipping transaction recording');
    return;
  }

  const maxRetries = 3;
  const delays = [1000, 2000, 4000]; // exponential backoff

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/record-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tx_signature: txSignature,
          wallet_address: walletAddress,
          need_slug: needSlug,
          note,
        }),
      });

      // 409 = already recorded — treat as success
      if (res.ok || res.status === 409) {
        return;
      }

      // 4xx errors (except 404/409) are not retryable
      if (res.status >= 400 && res.status < 500 && res.status !== 404) {
        console.warn('Failed to record transaction:', await res.text());
        return;
      }

      // 404 or 5xx — retry
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      } else {
        console.warn('Failed to record transaction after retries:', await res.text());
      }
    } catch {
      // Network error — retry
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delays[attempt]));
      }
      // Fire-and-forget — transaction is already on-chain
    }
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
