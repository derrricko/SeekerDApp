// v2 wallet-sign auth — single edge function
//
// FLOW:
//   1. Client sends { wallet, signature, message } (message = "glimpse-auth:{timestamp}")
//   2. Verify ed25519 signature against wallet public key
//   3. Check timestamp is within 5 minutes
//   4. Issue a Supabase JWT with wallet address in claims
//
// This replaces the v1 SIWS 3-step flow (nonce → sign → verify).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { create } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';
import { decode as decodeBase64 } from 'https://deno.land/std@0.177.0/encoding/base64.ts';
import nacl from 'https://esm.sh/tweetnacl@1.0.3';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || Deno.env.get('SUPABASE_JWT_SECRET')!;
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const TOKEN_TTL_S = 60 * 60 * 24; // 24 hours

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { wallet, signature, message } = await req.json();

    // --- Validate inputs ---
    if (!wallet || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing wallet, signature, or message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Check timestamp freshness ---
    // Message format: "glimpse-auth:{unix_ms}"
    const match = message.match(/^glimpse-auth:(\d+)$/);
    if (!match) {
      return new Response(
        JSON.stringify({ error: 'Invalid message format. Expected: glimpse-auth:{timestamp}' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const timestamp = parseInt(match[1], 10);
    const age = Date.now() - timestamp;
    if (age > MAX_AGE_MS || age < -MAX_AGE_MS) {
      return new Response(
        JSON.stringify({ error: 'Message expired. Please try again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Verify ed25519 signature ---
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = decodeBase64(signature);
    const publicKeyBytes = decodeBase58(wallet, 32);

    const valid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // --- Issue JWT ---
    const now = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const token = await create(
      { alg: 'HS256', typ: 'JWT' },
      {
        sub: wallet,
        wallet,
        role: 'authenticated',
        aud: 'authenticated',
        iss: 'glimpse',
        iat: now,
        exp: now + TOKEN_TTL_S,
      },
      key,
    );

    return new Response(
      JSON.stringify({ token, wallet, expires_at: now + TOKEN_TTL_S }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('wallet-auth error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// --- Base58 decode (Solana wallet addresses) ---
// When expectedLen is provided (e.g. 32 for public keys), the output is
// left-padded with zero bytes so the result is always exactly that length.
// This prevents nacl.sign.detached.verify from receiving a short key when the
// raw bytes happen to have leading zeros (BigInt drops them).
function decodeBase58(str: string, expectedLen?: number): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE = BigInt(58);

  let num = 0n;
  for (const char of str) {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`);
    num = num * BASE + BigInt(idx);
  }

  // Count leading '1's (zero bytes in base58)
  let leadingZeros = 0;
  for (const char of str) {
    if (char === '1') leadingZeros++;
    else break;
  }

  // Convert BigInt to bytes
  const hex = num.toString(16);
  const paddedHex = hex.length % 2 ? '0' + hex : hex;
  const numBytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < numBytes.length; i++) {
    numBytes[i] = parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
  }

  const rawLen = leadingZeros + numBytes.length;
  const outLen = expectedLen ?? rawLen;

  if (expectedLen && rawLen > expectedLen) {
    throw new Error(`Base58 decoded length ${rawLen} exceeds expected ${expectedLen}`);
  }

  // Place bytes right-aligned in the output buffer so leading zeros are preserved
  const result = new Uint8Array(outLen);
  result.set(numBytes, outLen - numBytes.length);
  // Leading '1' chars already accounted for by the zero-filled prefix
  return result;
}
