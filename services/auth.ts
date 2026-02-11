/**
 * SIWS (Sign-In With Solana) auth helpers.
 * Communicates with the nonce and siws-verify Edge Functions.
 */

import {getSupabase} from './supabase';
import {SUPABASE_URL} from '../config/env';

/**
 * Fetch a fresh nonce from the nonce Edge Function.
 */
export async function fetchNonce(): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/nonce`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
  });

  if (!res.ok) {
    throw new Error('Failed to fetch nonce');
  }

  const {nonce} = await res.json();
  return nonce;
}

/**
 * Verify a SIWS signature and obtain a Supabase JWT.
 */
export async function verifySIWS(
  message: string,
  signature: string,
  publicKey: string,
): Promise<{token: string; profile: any}> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/siws-verify`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message, signature, publicKey}),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'SIWS verification failed');
  }

  return res.json();
}

/**
 * Set a custom JWT on the Supabase client (from SIWS verification).
 */
export async function setSupabaseSession(token: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return;
  }
  await supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  });
}
