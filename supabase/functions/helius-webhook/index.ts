// supabase/functions/helius-webhook/index.ts
//
// Receives Helius webhook POSTs when USDC arrives at the Glimpse pool wallet.
// Parses enhanced transaction data, finds Glimpse memo, and auto-records the
// donation in Supabase. Idempotent on tx_signature — safe for duplicate POSTs.
//
// This is the server-side counterpart to the client-side record-donation flow.
// Both paths can record the same donation — the first one wins (upsert).

import {serve} from 'https://deno.land/std@0.177.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_AUTH_TOKEN = Deno.env.get('HELIUS_WEBHOOK_AUTH_TOKEN') || '';
const ADMIN_WALLET =
  Deno.env.get('ADMIN_WALLET') ||
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
const MATCHING_POOL_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return json({ok: true}, 200);
  }

  if (req.method !== 'POST') {
    return json({error: 'Method not allowed'}, 405);
  }

  if (!WEBHOOK_AUTH_TOKEN) {
    console.error('[helius-webhook] HELIUS_WEBHOOK_AUTH_TOKEN is not set');
    return json({error: 'Webhook auth not configured'}, 500);
  }

  // Validate webhook auth token (Helius sends this in Authorization header)
  const authHeader = req.headers.get('authorization') || '';
  if (
    authHeader !== WEBHOOK_AUTH_TOKEN &&
    authHeader !== `Bearer ${WEBHOOK_AUTH_TOKEN}`
  ) {
    console.warn('[helius-webhook] Invalid auth token');
    return json({error: 'Unauthorized'}, 401);
  }

  try {
    const body = await req.json();

    // Helius sends an array of enhanced transactions
    const transactions: any[] = Array.isArray(body) ? body : [body];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    let processed = 0;
    let skipped = 0;

    for (const tx of transactions) {
      try {
        const result = await processTransaction(supabase, tx);
        if (result === 'processed') {
          processed++;
        } else {
          skipped++;
        }
      } catch (txError) {
        console.error(
          `[helius-webhook] Error processing tx ${tx?.signature}:`,
          txError,
        );
        skipped++;
      }
    }

    console.log(
      `[helius-webhook] Batch complete: ${processed} processed, ${skipped} skipped`,
    );

    return json({processed, skipped}, 200);
  } catch (error) {
    console.error('[helius-webhook] Error:', error);
    return json({error: 'Internal error'}, 500);
  }
});

async function processTransaction(
  supabase: ReturnType<typeof createClient>,
  tx: any,
): Promise<'processed' | 'skipped'> {
  const signature = tx?.signature;
  if (!signature) {
    return 'skipped';
  }

  // Find USDC transfer to pool wallet
  const tokenTransfers: any[] = tx?.tokenTransfers || [];
  const usdcTransfer = tokenTransfers.find(
    (t: any) =>
      t.mint === USDC_MINT &&
      t.toUserAccount === MATCHING_POOL_WALLET &&
      t.tokenAmount > 0,
  );

  if (!usdcTransfer) {
    return 'skipped'; // Not a USDC transfer to our pool
  }

  const donorWallet = usdcTransfer.fromUserAccount;
  const amountUSDC = usdcTransfer.tokenAmount;

  if (!donorWallet || !amountUSDC) {
    return 'skipped';
  }

  // Parse the Glimpse memo from the transaction
  const memo = extractGlimpseMemo(tx);
  if (!memo) {
    return 'skipped'; // Not a Glimpse transaction
  }

  // Check if donation already recorded (idempotent)
  const {data: existing} = await supabase
    .from('donations')
    .select('id')
    .eq('tx_signature', signature)
    .maybeSingle();

  if (existing) {
    return 'skipped'; // Already recorded by client
  }

  // Determine cadence from memo
  const cadence = memo.c === 'daily' ? 'daily' : 'one_time';

  // Insert donation
  const {data: donation, error: donationError} = await supabase
    .from('donations')
    .insert({
      tx_signature: signature,
      donor_wallet: donorWallet,
      recipient_wallet: MATCHING_POOL_WALLET,
      recipient_id: 'general', // Webhook lacks campaign context — client retry overwrites with real data
      amount_usdc: amountUSDC,
      cadence,
      donation_mode: 'solo',
      cause_preferences: [], // Unknown from webhook — client retry fills in actual preferences
      status: 'confirmed',
    })
    .select('id')
    .single();

  if (donationError) {
    // Unique constraint violation = already recorded (race condition with client)
    if (donationError.code === '23505') {
      return 'skipped';
    }
    throw donationError;
  }

  // Create conversation + welcome message
  const {data: conversation, error: convError} = await supabase
    .from('conversations')
    .insert({
      donation_id: donation.id,
      donor_wallet: donorWallet,
      admin_wallet: ADMIN_WALLET,
    })
    .select('id')
    .single();

  if (convError) {
    console.warn('[helius-webhook] Conversation insert failed:', convError);
    return 'processed'; // Donation recorded, conversation can be created later
  }

  // Welcome message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    sender_wallet: ADMIN_WALLET,
    body: `This is Derek from GiveGlimpse. Your donation of ${amountUSDC} USDC is confirmed on-chain and this thread is now open. If you have any questions, ask me here anytime. Otherwise, I will follow up in about 5 to 7 days with receipts, photos, and a proof update showing where your donation went.`,
  });

  console.log(
    `[helius-webhook] Recorded donation: ${signature} — ${amountUSDC} USDC from ${donorWallet.slice(0, 8)}`,
  );

  return 'processed';
}

/**
 * Extract Glimpse memo from enhanced transaction data.
 * Helius parses instructions including memo program data.
 */
function extractGlimpseMemo(tx: any): any | null {
  // Method 1: Check Helius's parsed instructions
  const instructions: any[] = tx?.instructions || [];
  for (const ix of instructions) {
    if (
      ix?.programId === MEMO_PROGRAM_ID ||
      ix?.program === 'spl-memo' ||
      ix?.program === 'memo'
    ) {
      const data = ix?.data || ix?.parsed;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.app === 'glimpse' && parsed?.tok === 'usdc') {
            return parsed;
          }
        } catch {
          // Not JSON memo, skip
        }
      }
    }
  }

  // Method 2: Check the events/memo field (Helius sometimes surfaces memos here)
  const memoEvent = tx?.events?.memo;
  if (typeof memoEvent === 'string') {
    try {
      const parsed = JSON.parse(memoEvent);
      if (parsed?.app === 'glimpse' && parsed?.tok === 'usdc') {
        return parsed;
      }
    } catch {
      // Not JSON, skip
    }
  }

  // Method 3: Check accountData for memo program
  const accountData: any[] = tx?.accountData || [];
  for (const account of accountData) {
    if (account?.program === 'spl-memo') {
      const data = account?.data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.app === 'glimpse' && parsed?.tok === 'usdc') {
            return parsed;
          }
        } catch {
          // Not JSON, skip
        }
      }
    }
  }

  return null;
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}
