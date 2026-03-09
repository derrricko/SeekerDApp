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
//   8. Upsert donation (amount_usdc, cause_preferences, donation_mode)
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

// Glimpse destination wallet + pre-computed USDC ATA (mainnet)
//   Derivation: getAssociatedTokenAddress(USDC_MINT_MAINNET, GLIMPSE_WALLET)
//   USDC_MINT_MAINNET = EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
//   GLIMPSE_WALLET = DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk
//   → ATA = GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa
//   IMPORTANT: If wallet or mint changes, re-derive via spl-token on client.
const MATCHING_POOL_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
const MATCHING_POOL_USDC_ATA = 'GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa';
const USDC_DECIMALS = 6;

// Seeker Genesis Token (SGT) — Token-2022 non-transferable NFT.
const SGT_MINT_AUTHORITY = 'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4';
// SGT uses self-referencing metadata: the metadata pointer and group mint
// are both the same address. Verified against on-chain SGT mint account.
const SGT_METADATA_ADDRESS = 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te';
const SGT_GROUP_MINT_ADDRESS = 'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te';
const TOKEN_2022_PROGRAM_ID = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';

type CampaignId =
  | 'public-schools'
  | 'single-moms-crisis'
  | 'foster-care-after-school'
  | 'classroom-needs';

interface CampaignRule {
  id: CampaignId;
  minimumUSDC: number;
  causePreferences: string[];
}

// SYNC: campaign rules must match CAMPAIGN_OPTIONS in config/donationConfig.ts
const CAMPAIGN_RULES: CampaignRule[] = [
  {
    id: 'public-schools',
    minimumUSDC: 25,
    causePreferences: ['education', 'public-schools'],
  },
  {
    id: 'single-moms-crisis',
    minimumUSDC: 50,
    causePreferences: ['family-crisis', 'single-moms'],
  },
  {
    id: 'foster-care-after-school',
    minimumUSDC: 100,
    causePreferences: ['foster-care', 'child-essentials', 'after-school'],
  },
  {
    id: 'classroom-needs',
    minimumUSDC: 1,
    causePreferences: ['education', 'classroom-needs'],
  },
];

const ALLOWED_CAUSE_PREFERENCES = new Set(
  CAMPAIGN_RULES.flatMap(rule => rule.causePreferences),
);

// ---------- Rate Limiting (in-memory, resets on cold start) ----------

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(wallet: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(wallet);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(wallet, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ---------- RPC Error class ----------

class RPCError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RPCError';
  }
}

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

    if (!checkRateLimit(wallet)) {
      return json({error: 'Too many requests. Please try again later.'}, 429);
    }

    // SGT gate — only Seeker device owners can donate.
    if (Deno.env.get('SGT_GATE_ENABLED') !== 'false') {
      await verifySeekerTokenServerSide(wallet);
    }

    const body = await req.json();
    const txSignature =
      typeof body?.txSignature === 'string' ? body.txSignature.trim() : '';
    const causePreferences = normalizeCausePreferences(body?.causePreferences);
    const donationMode = body?.donationMode === 'group' ? 'group' : 'solo';
    const classroomNeedId =
      typeof body?.classroomNeedId === 'string'
        ? body.classroomNeedId.trim()
        : null;

    if (!txSignature) {
      return json({error: 'txSignature is required'}, 400);
    }

    // Validate classroomNeedId format if present (must be UUID)
    if (
      classroomNeedId &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        classroomNeedId,
      )
    ) {
      return json({error: 'Invalid classroom need ID format'}, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    const parsed = await fetchAndValidateUSDCTransaction(txSignature, wallet);

    // --- Classroom Need Mode ---
    if (classroomNeedId) {
      // Validate: on-chain memo.cn must match the request body classroomNeedId.
      // This prevents a modified client from claiming any open need at the same price
      // by sending a valid transfer with one need in the memo and a different need in the body.
      if (parsed.memoCn !== classroomNeedId) {
        return json(
          {error: 'Memo classroom need ID does not match request'},
          422,
        );
      }

      // Fetch the need to validate it exists and is open
      const {data: need, error: needError} = await supabase
        .from('classroom_needs')
        .select('id, title, price_usdc, status')
        .eq('id', classroomNeedId)
        .maybeSingle();

      if (needError) {
        throw needError;
      }
      if (!need) {
        return json({error: 'Classroom need not found'}, 404);
      }

      // Exact amount match (Correction #4) — ±1 microUSDC tolerance for float rounding only
      const needPriceRaw = Math.round(Number(need.price_usdc) * 10 ** USDC_DECIMALS);
      const txAmountRaw = Math.round(parsed.amountUSDC * 10 ** USDC_DECIMALS);
      const amountDiff = Math.abs(needPriceRaw - txAmountRaw);
      if (amountDiff > 1) {
        return json(
          {
            error: `Amount must be exactly ${Number(need.price_usdc).toFixed(2)} USDC for this classroom need.`,
          },
          422,
        );
      }

      const donationId = await upsertDonation({
        supabase,
        txSignature,
        donorWallet: parsed.authority,
        recipientWallet: MATCHING_POOL_WALLET,
        recipientId: 'classroom-needs',
        amountUSDC: parsed.amountUSDC,
        cadence: parsed.cadence,
        causePreferences: ['education', 'classroom-needs'],
        donationMode,
        classroomNeedId,
      });

      // Idempotent atomic claim (Correction #3)
      const {data: claimResult} = await supabase.rpc('claim_classroom_need', {
        p_need_id: classroomNeedId,
        p_donation_id: donationId,
        p_donor_wallet: parsed.authority,
      });

      if (claimResult === 'not_found') {
        return json({error: 'Classroom need not found'}, 404);
      }
      if (claimResult === 'conflict') {
        return json({error: 'This classroom need has already been funded by another donor'}, 409);
      }
      // 'claimed' or 'already_claimed_same' are both success

      // Upsert purchase_orders row (idempotent on donation_id unique constraint)
      await supabase.from('purchase_orders').upsert(
        {
          classroom_need_id: classroomNeedId,
          donation_id: donationId,
          amount_usdc: parsed.amountUSDC,
          status: 'pending',
        },
        {onConflict: 'donation_id', ignoreDuplicates: true},
      );

      const conversationId = await upsertConversation({
        supabase,
        donationId,
        donorWallet: parsed.authority,
        amountUSDC: parsed.amountUSDC,
        classroomNeedTitle: need.title,
      });

      return json(
        {
          txSignature,
          donationId,
          conversationId,
          donorWallet: parsed.authority,
          recipientWallet: MATCHING_POOL_WALLET,
          amountUSDC: parsed.amountUSDC,
          campaignId: 'classroom-needs',
          classroomNeedId,
        },
        200,
      );
    }

    // --- Standard Donation Mode ---
    if (causePreferences.length < 2 || causePreferences.length > 3) {
      return json(
        {error: 'Between 2 and 3 cause preferences are required.'},
        400,
      );
    }

    const selectedCampaign = resolveCampaignFromCauses(causePreferences);
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

    // RPC errors → always 500 generic (prevent RPC error messages leaking to client)
    if (error instanceof RPCError) {
      return json({error: 'Internal server error'}, 500);
    }

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
    // SGT gate → 403 (not a Seeker device owner)
    if (lc.includes('seeker genesis token') || lc.includes('seeker device')) {
      return json({error: message}, 403);
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
      lc.includes('exceeds maximum') ||
      lc.includes('txsignature is required') ||
      lc.includes('classroom need')
    ) {
      return json({error: message}, 422);
    }
    return json({error: 'Internal server error'}, 500);
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
  /** Classroom need ID from on-chain memo (full UUID or null) */
  memoCn: string | null;
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

  // Validate destination is the Glimpse USDC ATA
  if (destination !== MATCHING_POOL_USDC_ATA) {
    throw new Error(
      'Transaction destination does not match Glimpse USDC account',
    );
  }

  // Extract amount from exact raw units, not uiAmount float.
  const rawAmount = parseRawUSDCAmount(tokenAmount);
  const amountUSDC = Number(rawAmount) / 10 ** USDC_DECIMALS;
  if (!Number.isFinite(amountUSDC) || amountUSDC <= 0) {
    throw new Error('Invalid transfer amount');
  }

  // Server-side max donation cap
  const MAX_USDC = 10_000;
  if (amountUSDC > MAX_USDC) {
    throw new Error(`Donation amount ${amountUSDC} USDC exceeds maximum of ${MAX_USDC} USDC`);
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

  // Validate memo amount matches transfer (allow 1-microUSDC tolerance
  // for IEEE 754 float rounding between client memo and on-chain raw amount)
  const memoAmountRaw = parseMemoAmountToRaw(memo?.a);
  const amountDiff =
    memoAmountRaw > rawAmount
      ? memoAmountRaw - rawAmount
      : rawAmount - memoAmountRaw;
  if (amountDiff > 1n) {
    throw new Error('Memo amount does not match transfer amount');
  }

  const cadence =
    memo?.c === 'daily' || memo?.c === 'one_time' ? memo.c : 'one_time';

  // Extract classroom need ID from memo (full UUID)
  const memoCn =
    typeof memo?.cn === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memo.cn)
      ? memo.cn
      : null;

  return {
    authority,
    destination,
    mint,
    amountUSDC,
    cadence,
    memoCn,
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

// ---------- SGT Verification (Server-Side) ----------

async function verifySeekerTokenServerSide(walletAddress: string): Promise<void> {
  // Fetch all Token-2022 accounts for this wallet
  const result = await rpc('getTokenAccountsByOwner', [
    walletAddress,
    {programId: TOKEN_2022_PROGRAM_ID},
    {encoding: 'jsonParsed'},
  ]);

  const accounts = result?.value || [];
  const MAX_TOKEN_ACCOUNTS = 20;
  let checked = 0;

  for (const account of accounts) {
    if (++checked > MAX_TOKEN_ACCOUNTS) break;

    const parsed = account?.account?.data?.parsed?.info;
    if (!parsed) continue;

    const tokenAmount = parsed.tokenAmount;
    if (!tokenAmount || Number(tokenAmount.amount) === 0) continue;

    const mintAddress = parsed.mint;
    if (!mintAddress) continue;

    // Fetch mint account to check authority and extensions
    const mintInfo = await rpc('getAccountInfo', [
      mintAddress,
      {encoding: 'jsonParsed'},
    ]);

    const mintData = mintInfo?.value?.data?.parsed?.info;
    if (!mintData) continue;

    // Check 1: mintAuthority
    if (mintData.mintAuthority !== SGT_MINT_AUTHORITY) continue;

    // Check 2 & 3: extensions (jsonParsed returns structured extension data)
    const extensions = mintData.extensions || [];
    let metadataPointerValid = false;
    let groupMemberValid = false;

    for (const ext of extensions) {
      if (ext.extension === 'metadataPointer') {
        const state = ext.state;
        if (
          state?.authority === SGT_MINT_AUTHORITY &&
          state?.metadataAddress === SGT_METADATA_ADDRESS
        ) {
          metadataPointerValid = true;
        }
      }
      if (ext.extension === 'tokenGroupMember') {
        const state = ext.state;
        if (state?.group === SGT_GROUP_MINT_ADDRESS) {
          groupMemberValid = true;
        }
      }
    }

    // Fallback: if extensions array is empty but mintAuthority matches,
    // try base64 encoding for raw TLV parsing
    if (!metadataPointerValid && !groupMemberValid && extensions.length === 0) {
      const rawInfo = await rpc('getAccountInfo', [
        mintAddress,
        {encoding: 'base64'},
      ]);
      const rawData = rawInfo?.value?.data;
      if (rawData && Array.isArray(rawData) && rawData[0]) {
        const bytes = Uint8Array.from(atob(rawData[0]), c => c.charCodeAt(0));
        // Token-2022 mint: 82 bytes fixed + TLV extensions
        if (bytes.length > 82) {
          const tlv = bytes.slice(82);
          let offset = 0;
          while (offset + 4 <= tlv.length) {
            const type = tlv[offset] | (tlv[offset + 1] << 8);
            const length = tlv[offset + 2] | (tlv[offset + 3] << 8);
            if (offset + 4 + length > tlv.length) break;

            // Type 18 = MetadataPointer: [32 authority][32 metadataAddress]
            if (type === 18 && length >= 64) {
              const authority = encodeBase58(tlv.slice(offset + 4, offset + 4 + 32));
              const metaAddr = encodeBase58(tlv.slice(offset + 4 + 32, offset + 4 + 64));
              if (authority === SGT_MINT_AUTHORITY && metaAddr === SGT_METADATA_ADDRESS) {
                metadataPointerValid = true;
              }
            }
            // Type 22 = TokenGroupMember: [32 mint][32 group]
            if (type === 22 && length >= 64) {
              const group = encodeBase58(tlv.slice(offset + 4 + 32, offset + 4 + 64));
              if (group === SGT_GROUP_MINT_ADDRESS) {
                groupMemberValid = true;
              }
            }
            offset += 4 + length;
          }
        }
      }
    }

    if (metadataPointerValid && groupMemberValid) {
      return; // Valid SGT found
    }
  }

  throw new Error(
    'Seeker Genesis Token not found — donation requires a Solana Seeker device',
  );
}

// Minimal base58 encoder for raw TLV fallback (no external dependency in Deno)
function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const b of bytes) {
    num = num * 256n + BigInt(b);
  }
  let encoded = '';
  while (num > 0n) {
    encoded = ALPHABET[Number(num % 58n)] + encoded;
    num = num / 58n;
  }
  // Leading zeros
  for (const b of bytes) {
    if (b !== 0) break;
    encoded = '1' + encoded;
  }
  return encoded || '1';
}

// ---------- RPC ----------

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
    throw new RPCError(
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
  classroomNeedId?: string | null;
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
    classroomNeedId,
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
      status: 'confirmed',
      ...(classroomNeedId ? {classroom_need_id: classroomNeedId} : {}),
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
  classroomNeedTitle?: string;
}): Promise<string> {
  const {supabase, donationId, donorWallet, amountUSDC, classroomNeedTitle} = params;

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

  // Welcome message — different copy for need-mode vs general donations
  const welcomeBody = classroomNeedTitle
    ? `Your funding for '${classroomNeedTitle}' is confirmed on-chain. Glimpse is now reviewing the request before purchase. We'll update this thread with purchase proof, shipping, and delivery.`
    : `This is Derrick from GiveGlimpse. Your donation of ${amountUSDC} USDC is confirmed on-chain and this thread is now open. If you have any questions, ask me here anytime. I will update this message thread with information, photos, and receipts as your donation gets implemented.`;

  const {error: messageError} = await supabase.from('messages').insert({
    conversation_id: inserted.id,
    sender_wallet: ADMIN_WALLET,
    body: welcomeBody,
  });

  if (messageError) {
    console.warn(
      '[record-donation] welcome message insert failed:',
      messageError,
    );
  }

  // For need-mode: also insert the initial "funded" proof event
  if (classroomNeedTitle) {
    const proofEvent = JSON.stringify({
      kind: 'proof_event',
      event: 'funded',
      label: 'FUNDED',
      detail: `Your funding is confirmed on-chain.`,
    });
    await supabase.from('messages').insert({
      conversation_id: inserted.id,
      sender_wallet: ADMIN_WALLET,
      body: proofEvent,
    });
  }

  return inserted.id;
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}
