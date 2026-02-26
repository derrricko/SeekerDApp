import {serve} from 'https://deno.land/std@0.177.0/http/server.ts';
import {verify} from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET =
  Deno.env.get('JWT_SECRET') || Deno.env.get('SUPABASE_JWT_SECRET')!;
const SOLANA_RPC_URL = Deno.env.get('SOLANA_RPC_URL') || 'https://api.devnet.solana.com';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const ADMIN_WALLET =
  Deno.env.get('ADMIN_WALLET') ||
  'HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5';

const RECIPIENT_WALLETS: Record<string, string> = {
  'maria-car': '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
  'evan-beheard': '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
  'jasmine-brakes': '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
  'open-fund': '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
};

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
    const recipientId =
      typeof body?.recipientId === 'string' ? body.recipientId.trim() : '';
    const expectedRecipientWallet = RECIPIENT_WALLETS[recipientId];

    if (!txSignature) {
      return json({error: 'txSignature is required'}, 400);
    }
    if (!expectedRecipientWallet) {
      return json({error: 'Unknown recipientId'}, 400);
    }

    const parsed = await fetchAndValidateDonationTransaction(
      txSignature,
      wallet,
      expectedRecipientWallet,
    );

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    const donationId = await upsertDonation({
      supabase,
      txSignature,
      donorWallet: parsed.source,
      recipientWallet: parsed.destination,
      recipientId,
      amountSol: parsed.amountSol,
    });

    const conversationId = await upsertConversation({
      supabase,
      donationId,
      donorWallet: parsed.source,
      amountSol: parsed.amountSol,
    });

    return json(
      {
        txSignature,
        donationId,
        conversationId,
        donorWallet: parsed.source,
        recipientWallet: parsed.destination,
        amountSol: parsed.amountSol,
      },
      200,
    );
  } catch (error) {
    console.error('[record-donation] error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return json({error: message}, 500);
  }
});

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
    ['verify', 'sign'],
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

async function fetchAndValidateDonationTransaction(
  txSignature: string,
  expectedDonorWallet: string,
  expectedRecipientWallet: string,
): Promise<{
  source: string;
  destination: string;
  amountSol: number;
}> {
  const tx = await getTransactionWithRetry(txSignature);

  if (!tx) {
    throw new Error('Transaction not found');
  }
  if (tx.meta?.err) {
    throw new Error('Transaction failed on-chain');
  }

  const instructions: any[] = tx.transaction?.message?.instructions || [];
  const transferIx = instructions.find(
    ix => ix?.program === 'system' && ix?.parsed?.type === 'transfer',
  );

  if (!transferIx) {
    throw new Error('No system transfer instruction found in transaction');
  }

  const source = transferIx.parsed?.info?.source;
  const destination = transferIx.parsed?.info?.destination;
  const lamports = Number(transferIx.parsed?.info?.lamports);

  if (typeof source !== 'string' || typeof destination !== 'string') {
    throw new Error('Invalid transfer instruction shape');
  }
  if (!Number.isFinite(lamports) || lamports <= 0) {
    throw new Error('Invalid transfer amount');
  }

  if (source !== expectedDonorWallet) {
    throw new Error('Transaction donor does not match authenticated wallet');
  }
  if (destination !== expectedRecipientWallet) {
    throw new Error('Transaction recipient does not match selected recipient');
  }

  const memoIx = instructions.find(
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
  if (memo?.d !== source.slice(0, 8) || memo?.r !== destination.slice(0, 8)) {
    throw new Error('Memo participant markers do not match transfer');
  }
  const memoAmount = Number(memo?.a);
  const amountSol = lamports / 1_000_000_000;
  if (!Number.isFinite(memoAmount) || Math.abs(memoAmount - amountSol) > 1e-9) {
    throw new Error('Memo amount does not match transfer amount');
  }

  return {
    source,
    destination,
    amountSol,
  };
}

async function getTransactionWithRetry(txSignature: string): Promise<any> {
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tx = await rpc('getTransaction', [
      txSignature,
      {
        encoding: 'jsonParsed',
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      },
    ]);
    if (tx) {
      return tx;
    }

    if (attempt < maxAttempts) {
      await sleep(500 * attempt);
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
      payload?.error?.message || `RPC ${method} failed with status ${response.status}`,
    );
  }
  return payload.result;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function upsertDonation(params: {
  supabase: ReturnType<typeof createClient>;
  txSignature: string;
  donorWallet: string;
  recipientWallet: string;
  recipientId: string;
  amountSol: number;
}): Promise<string> {
  const {
    supabase,
    txSignature,
    donorWallet,
    recipientWallet,
    recipientId,
    amountSol,
  } = params;

  const {data: existing, error: existingError} = await supabase
    .from('donations')
    .select('id, donor_wallet, recipient_wallet, recipient_id')
    .eq('tx_signature', txSignature)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    if (
      existing.donor_wallet !== donorWallet ||
      existing.recipient_wallet !== recipientWallet ||
      existing.recipient_id !== recipientId
    ) {
      throw new Error('Existing donation record does not match tx details');
    }
    return existing.id;
  }

  const {data: inserted, error: insertError} = await supabase
    .from('donations')
    .insert({
      tx_signature: txSignature,
      donor_wallet: donorWallet,
      recipient_wallet: recipientWallet,
      recipient_id: recipientId,
      amount_sol: amountSol,
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.id;
}

async function upsertConversation(params: {
  supabase: ReturnType<typeof createClient>;
  donationId: string;
  donorWallet: string;
  amountSol: number;
}): Promise<string> {
  const {supabase, donationId, donorWallet, amountSol} = params;

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

  const {error: messageError} = await supabase.from('messages').insert({
    conversation_id: inserted.id,
    sender_wallet: ADMIN_WALLET,
    body: `Your donation of ${amountSol} SOL reached its destination. We'll share updates here as the impact unfolds.`,
  });

  if (messageError) {
    console.warn('[record-donation] welcome message insert failed:', messageError);
  }

  return inserted.id;
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}
