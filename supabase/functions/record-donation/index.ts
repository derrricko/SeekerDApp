// v2 USDC donation recording — validates SPL transferChecked on-chain
//
// VALIDATION FLOW:
//   1. Verify JWT → extract wallet
//   2. Fetch tx from Solana RPC (jsonParsed, 6 retries)
//   3. Find spl-token transferChecked instruction
//   4. Validate: info.mint === USDC_MINT
//   5. Validate: info.authority === JWT wallet (donor)
//   6. Validate: info.destination === MATCHING_POOL_USDC_ATA
//   7. Validate: memo has tok="usdc", app="glimpse"
//   8. Upsert donation (amount_usdc, cause_preferences, donation_mode, hold tracking)
//   9. Upsert conversation + welcome message timeline copy

import {serve} from 'https://deno.land/std@0.177.0/http/server.ts';
import {verify} from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET =
  Deno.env.get('JWT_SECRET') || Deno.env.get('SUPABASE_JWT_SECRET')!;
const SOLANA_RPC_URL =
  Deno.env.get('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const ADMIN_WALLET =
  Deno.env.get('ADMIN_WALLET') ||
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';

// USDC mint — mainnet only. Devnet mint removed for mainnet launch.
// If testing on devnet, set VALID_USDC_MINTS via env or re-add temporarily.
const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const VALID_USDC_MINTS = new Set([USDC_MINT_MAINNET]);

// Matching pool wallet + pre-computed USDC ATA (mainnet)
//   Derivation: getAssociatedTokenAddress(USDC_MINT_MAINNET, MATCHING_POOL_WALLET)
//   USDC_MINT_MAINNET = EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
//   MATCHING_POOL_WALLET = DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk
//   → ATA = GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa
//   IMPORTANT: If wallet or mint changes, re-derive via spl-token on client.
const MATCHING_POOL_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
const MATCHING_POOL_USDC_ATA = 'GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa';
const USDC_DECIMALS = 6;

type CampaignId =
  | 'teacher-supplies'
  | 'single-moms-crisis'
  | 'foster-care-after-school';

interface CampaignRule {
  id: CampaignId;
  minimumUSDC: number;
  causePreferences: string[];
}

const CAMPAIGN_RULES: CampaignRule[] = [
  {
    id: 'teacher-supplies',
    minimumUSDC: 10,
    causePreferences: ['education', 'teacher-supplies'],
  },
  {
    id: 'single-moms-crisis',
    minimumUSDC: 25,
    causePreferences: ['family-crisis', 'single-moms'],
  },
  {
    id: 'foster-care-after-school',
    minimumUSDC: 15,
    causePreferences: ['foster-care', 'child-essentials', 'after-school'],
  },
];

const ALLOWED_CAUSE_PREFERENCES = new Set(
  CAMPAIGN_RULES.flatMap(rule => rule.causePreferences),
);

// 48-hour hold window (ms)
const HOLD_DURATION_MS = 48 * 60 * 60 * 1000;

// CORS: use * for mobile client (React Native fetch does not send web Origin).
// Auth is enforced via JWT bearer token, not CORS origin.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {headers: corsHeaders});
  }

  if (req.method !== 'POST') {
    return json({error: 'Method not allowed'}, 405);
  }

  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = extractBearerToken(authHeader);
    if (!token) {
      return json({error: 'Missing bearer token'}, 401);
    }

    const wallet = await verifyWalletFromJwt(token);

    const body = await req.json();
    const txSignature =
      typeof body?.txSignature === 'string' ? body.txSignature.trim() : '';
    const causePreferences = normalizeCausePreferences(body?.causePreferences);
    const donationMode = body?.donationMode === 'group' ? 'group' : 'solo';

    if (!txSignature) {
      return json({error: 'txSignature is required'}, 400);
    }

    if (causePreferences.length < 2 || causePreferences.length > 3) {
      return json(
        {error: 'Between 2 and 3 cause preferences are required.'},
        400,
      );
    }

    const selectedCampaign = resolveCampaignFromCauses(causePreferences);
    const parsed = await fetchAndValidateUSDCTransaction(txSignature, wallet);
    if (parsed.amountUSDC < selectedCampaign.minimumUSDC) {
      return json(
        {
          error: `Minimum for ${selectedCampaign.id} is ${selectedCampaign.minimumUSDC.toFixed(
            2,
          )} USDC.`,
        },
        400,
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    const donationId = await upsertDonation({
      supabase,
      txSignature,
      donorWallet: parsed.authority,
      recipientWallet: MATCHING_POOL_WALLET,
      recipientId: selectedCampaign.id,
      amountUSDC: parsed.amountUSDC,
      cadence: parsed.cadence,
      causePreferences,
      donationMode,
    });

    const conversationId = await upsertConversation({
      supabase,
      donationId,
      donorWallet: parsed.authority,
      amountUSDC: parsed.amountUSDC,
    });

    return json(
      {
        txSignature,
        donationId,
        conversationId,
        donorWallet: parsed.authority,
        recipientWallet: MATCHING_POOL_WALLET,
        amountUSDC: parsed.amountUSDC,
        campaignId: selectedCampaign.id,
      },
      200,
    );
  } catch (error) {
    console.error('[record-donation] error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    const lc = message.toLowerCase();
    // Auth errors → 401 (client should re-auth, not retry with same token)
    if (
      lc.includes('bearer token') ||
      lc.includes('expired') ||
      lc.includes('invalid auth') ||
      lc.includes('missing wallet claim')
    ) {
      return json({error: message}, 401);
    }
    // Validation errors → 422 (permanent failure, do not retry)
    if (
      lc.includes('does not match') ||
      lc.includes('invalid token mint') ||
      lc.includes('missing fields') ||
      lc.includes('memo') ||
      lc.includes('cause preferences') ||
      lc.includes('campaign') ||
      lc.includes('minimum') ||
      lc.includes('txsignature is required')
    ) {
      return json({error: message}, 422);
    }
    return json({error: message}, 500);
  }
});

// ---------- Auth ----------

function extractBearerToken(header: string): string | null {
  const prefix = 'Bearer ';
  if (!header.startsWith(prefix)) {
    return null;
  }
  return header.slice(prefix.length).trim() || null;
}

async function verifyWalletFromJwt(token: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['verify'],
  );

  const payload = await verify(token, key, 'HS256');
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid auth token payload');
  }

  const wallet = (payload as Record<string, unknown>).wallet;
  const role = (payload as Record<string, unknown>).role;
  const exp = (payload as Record<string, unknown>).exp;
  if (typeof wallet !== 'string' || wallet.length < 32) {
    throw new Error('Token missing wallet claim');
  }
  if (role !== 'authenticated') {
    throw new Error('Invalid auth role');
  }
  if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) {
    throw new Error('Auth token expired');
  }

  return wallet;
}

// ---------- Transaction Validation (USDC SPL transferChecked) ----------
//
//   jsonParsed output for spl-token transferChecked:
//   {
//     program: "spl-token",
//     parsed: {
//       type: "transferChecked",
//       info: {
//         source: "<donor ATA>",
//         mint: "<USDC mint>",
//         destination: "<pool ATA>",
//         authority: "<donor wallet>",
//         tokenAmount: { amount: "5000000", decimals: 6, uiAmount: 5.0 }
//       }
//     }
//   }

interface ParsedUSDCTransaction {
  authority: string;
  destination: string;
  mint: string;
  amountUSDC: number;
  cadence: 'one_time' | 'daily';
}

function normalizeCausePreferences(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') {
      continue;
    }
    const value = item.trim().toLowerCase();
    if (!value || !ALLOWED_CAUSE_PREFERENCES.has(value) || seen.has(value)) {
      continue;
    }
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}

function toCauseKey(values: string[]): string {
  return [...values].sort().join('|');
}

function resolveCampaignFromCauses(causePreferences: string[]): CampaignRule {
  const key = toCauseKey(causePreferences);
  const match = CAMPAIGN_RULES.find(
    rule => toCauseKey(rule.causePreferences) === key,
  );
  if (!match) {
    throw new Error('Cause preferences do not match a valid campaign');
  }
  return match;
}

function parseRawUSDCAmount(tokenAmount: any): bigint {
  const raw = tokenAmount?.amount;
  const decimals = Number(tokenAmount?.decimals);
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    throw new Error('Invalid raw token amount');
  }
  if (!Number.isFinite(decimals) || decimals !== USDC_DECIMALS) {
    throw new Error(`USDC decimals mismatch: expected ${USDC_DECIMALS}`);
  }
  const parsed = BigInt(raw);
  if (parsed <= 0n) {
    throw new Error('Invalid transfer amount');
  }
  return parsed;
}

function parseMemoAmountToRaw(memoAmount: unknown): bigint {
  const numeric =
    typeof memoAmount === 'number'
      ? memoAmount
      : typeof memoAmount === 'string'
      ? Number(memoAmount)
      : NaN;
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error('Memo amount is invalid');
  }

  const scaled = Math.round(numeric * 10 ** USDC_DECIMALS);
  if (!Number.isSafeInteger(scaled) || scaled <= 0) {
    throw new Error('Memo amount is out of range');
  }
  return BigInt(scaled);
}

async function fetchAndValidateUSDCTransaction(
  txSignature: string,
  expectedDonorWallet: string,
): Promise<ParsedUSDCTransaction> {
  const tx = await getTransactionWithRetry(txSignature);

  if (!tx) {
    throw new Error('Transaction not found');
  }
  if (tx.meta?.err) {
    throw new Error('Transaction failed on-chain');
  }

  // Only search top-level instructions for the transferChecked.
  // Glimpse always places transferChecked at the top level.
  // Scanning inner instructions would allow an attacker to inject
  // a fake transferChecked via CPI while the real top-level ix
  // sends funds elsewhere.
  const topInstructions: any[] = tx.transaction?.message?.instructions || [];

  // Find spl-token transferChecked instruction (top-level only)
  const transferIx = topInstructions.find(
    ix => ix?.program === 'spl-token' && ix?.parsed?.type === 'transferChecked',
  );

  if (!transferIx) {
    throw new Error(
      'No SPL token transferChecked instruction found in transaction',
    );
  }

  const info = transferIx.parsed?.info;
  if (!info) {
    throw new Error('Invalid transferChecked instruction shape');
  }

  const authority = info.authority as string;
  const destination = info.destination as string;
  const mint = info.mint as string;
  const tokenAmount = info.tokenAmount;

  if (!authority || !destination || !mint) {
    throw new Error('Missing fields in transferChecked instruction');
  }

  // Validate USDC mint
  if (!VALID_USDC_MINTS.has(mint)) {
    throw new Error(
      `Invalid token mint: ${mint}. Only USDC transfers are accepted.`,
    );
  }

  // Validate donor wallet matches JWT
  if (authority !== expectedDonorWallet) {
    throw new Error(
      'Transaction authority does not match authenticated wallet',
    );
  }

  // Validate destination is the matching pool USDC ATA
  if (destination !== MATCHING_POOL_USDC_ATA) {
    throw new Error(
      'Transaction destination does not match matching pool USDC account',
    );
  }

  // Extract amount from exact raw units, not uiAmount float.
  const rawAmount = parseRawUSDCAmount(tokenAmount);
  const amountUSDC = Number(rawAmount) / 10 ** USDC_DECIMALS;
  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    throw new Error('Invalid transfer amount');
  }

  // Validate memo
  const memoIx = topInstructions.find(
    ix =>
      ix?.programId === MEMO_PROGRAM_ID ||
      ix?.program === 'spl-memo' ||
      ix?.program === 'memo',
  );
  if (!memoIx) {
    throw new Error('Transaction is missing memo instruction');
  }

  const memoText =
    typeof memoIx.parsed === 'string'
      ? memoIx.parsed
      : typeof memoIx.parsed?.memo === 'string'
      ? memoIx.parsed.memo
      : null;
  if (!memoText) {
    throw new Error('Memo instruction payload is missing');
  }

  let memo: any;
  try {
    memo = JSON.parse(memoText);
  } catch {
    throw new Error('Memo payload is not valid JSON');
  }

  if (memo?.app !== 'glimpse') {
    throw new Error('Memo app marker is invalid');
  }
  if (memo?.tok !== 'usdc') {
    throw new Error('Memo token marker must be "usdc"');
  }

  // Validate memo amount matches transfer (within rounding tolerance)
  const memoAmountRaw = parseMemoAmountToRaw(memo?.a);
  if (memoAmountRaw !== rawAmount) {
    throw new Error('Memo amount does not match transfer amount');
  }

  const cadence =
    memo?.c === 'daily' || memo?.c === 'one_time' ? memo.c : 'one_time';

  return {
    authority,
    destination,
    mint,
    amountUSDC,
    cadence,
  };
}

// ---------- RPC helpers ----------

async function getTransactionWithRetry(txSignature: string): Promise<any> {
  // Finalized commitment takes ~12-15s on mainnet. Retry with backoff
  // to allow enough time: 2s, 4s, 6s, 8s, 10s = 30s total.
  // Reduced from 8 to stay safely within Supabase edge function timeout (60s).
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tx = await rpc('getTransaction', [
      txSignature,
      {
        encoding: 'jsonParsed',
        commitment: 'finalized',
        maxSupportedTransactionVersion: 0,
      },
    ]);
    if (tx) {
      return tx;
    }

    if (attempt < maxAttempts) {
      await sleep(2000 * attempt);
    }
  }

  throw new Error('Transaction not found');
}

async function rpc(method: string, params: unknown[]): Promise<any> {
  const response = await fetch(SOLANA_RPC_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: `record-donation-${Date.now()}`,
      method,
      params,
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload?.error) {
    throw new Error(
      payload?.error?.message ||
        `RPC ${method} failed with status ${response.status}`,
    );
  }
  return payload.result;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------- Database upserts ----------

async function upsertDonation(params: {
  supabase: ReturnType<typeof createClient>;
  txSignature: string;
  donorWallet: string;
  recipientWallet: string;
  recipientId: string;
  amountUSDC: number;
  cadence: 'one_time' | 'daily';
  causePreferences: string[];
  donationMode: string;
}): Promise<string> {
  const {
    supabase,
    txSignature,
    donorWallet,
    recipientWallet,
    recipientId,
    amountUSDC,
    cadence,
    causePreferences,
    donationMode,
  } = params;

  const {data: existing, error: existingError} = await supabase
    .from('donations')
    .select('id, donor_wallet, recipient_wallet')
    .eq('tx_signature', txSignature)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    if (
      existing.donor_wallet !== donorWallet ||
      existing.recipient_wallet !== recipientWallet
    ) {
      throw new Error('Existing donation record does not match tx details');
    }
    return existing.id;
  }

  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS).toISOString();

  let insertResult = await supabase
    .from('donations')
    .insert({
      tx_signature: txSignature,
      donor_wallet: donorWallet,
      recipient_wallet: recipientWallet,
      recipient_id: recipientId,
      amount_usdc: amountUSDC,
      cadence,
      donation_mode: donationMode,
      cause_preferences: causePreferences,
      hold_status: 'pending',
      hold_expires_at: holdExpiresAt,
    })
    .select('id')
    .single();

  if (insertResult.error) {
    throw insertResult.error;
  }

  return insertResult.data.id;
}

async function upsertConversation(params: {
  supabase: ReturnType<typeof createClient>;
  donationId: string;
  donorWallet: string;
  amountUSDC: number;
}): Promise<string> {
  const {supabase, donationId, donorWallet, amountUSDC} = params;

  const {data: existing, error: existingError} = await supabase
    .from('conversations')
    .select('id')
    .eq('donation_id', donationId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing.id;
  }

  const {data: inserted, error: insertError} = await supabase
    .from('conversations')
    .insert({
      donation_id: donationId,
      donor_wallet: donorWallet,
      admin_wallet: ADMIN_WALLET,
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  // Welcome message with timeline + next-steps copy
  const {error: messageError} = await supabase.from('messages').insert({
    conversation_id: inserted.id,
    sender_wallet: ADMIN_WALLET,
    body: `Next steps: Your donation of ${amountUSDC} USDC is confirmed on-chain. In 24-48 hours we will message you with the specific need your donation is supporting. In 5-7 days, this thread will include receipts, photos, and progress updates.`,
  });

  if (messageError) {
    console.warn(
      '[record-donation] welcome message insert failed:',
      messageError,
    );
  }

  return inserted.id;
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}
