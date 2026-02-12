/**
 * Deno Edge Function: /siws-verify
 *
 * Verifies a SIWS (Sign-In With Solana) signature:
 * 1. Accepts POST with { message, signature, publicKey }
 * 2. Verifies the ed25519 signature using tweetnacl
 * 3. Validates the nonce (exists in DB and not expired)
 * 4. Upserts the user's profile row
 * 5. Mints and returns a Supabase JWT with wallet_address claim
 *
 * Returns: { token: string, profile: { id, wallet_address, display_name, avatar_url } }
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import {
  decode as decodeBase64,
} from "https://deno.land/std@0.208.0/encoding/base64.ts";
import {
  create,
  getNumericDate,
} from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const JWT_EXPIRY_HOURS = 24;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Import the JWT secret as a CryptoKey for HMAC-SHA256 signing,
 * matching Supabase's internal JWT format.
 */
async function getSigningKey(): Promise<CryptoKey> {
  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(jwtSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Extract the nonce from a SIWS message string.
 * SIWS messages follow a structured format with "Nonce: <value>" on its own line.
 */
function extractNonce(message: string): string | null {
  const match = message.match(/Nonce:\s*(.+)/i);
  return match ? match[1].trim() : null;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // ── Parse and validate request body ──────────────────────────────────
    const body = await req.json();
    const { message, signature, publicKey } = body;

    if (!message || !signature || !publicKey) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: message, signature, publicKey",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Verify ed25519 signature ─────────────────────────────────────────
    const messageBytes = decodeBase64(message);
    const messageText = new TextDecoder().decode(messageBytes);
    let signatureBytes: Uint8Array;
    let publicKeyBytes: Uint8Array;

    try {
      signatureBytes = decodeBase64(signature);
      publicKeyBytes = decodeBase64(publicKey);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid base64 encoding for signature or publicKey" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (publicKeyBytes.length !== 32) {
      return new Response(
        JSON.stringify({ error: "Invalid public key length" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (signatureBytes.length !== 64) {
      return new Response(
        JSON.stringify({ error: "Invalid signature length" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes,
    );

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Initialize Supabase service client ───────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Validate nonce ───────────────────────────────────────────────────
    const nonce = extractNonce(messageText);
    if (!nonce) {
      return new Response(
        JSON.stringify({ error: "No nonce found in message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch the nonce row and check it exists + hasn't expired
    const { data: nonceRow, error: nonceError } = await supabase
      .from("nonces")
      .select("*")
      .eq("nonce", nonce)
      .single();

    if (nonceError || !nonceRow) {
      return new Response(
        JSON.stringify({ error: "Invalid or unknown nonce" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (new Date(nonceRow.expires_at) < new Date()) {
      // Clean up expired nonce
      await supabase.from("nonces").delete().eq("id", nonceRow.id);

      return new Response(
        JSON.stringify({ error: "Nonce has expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Consume the nonce (single-use) — delete it so it can't be replayed
    await supabase.from("nonces").delete().eq("id", nonceRow.id);

    // ── Derive wallet address from the public key ────────────────────────
    // The publicKey from the client is the base64-encoded Solana public key.
    // The wallet address is typically the base58-encoded form. We expect the
    // client to embed the wallet address in the SIWS message, so we extract it.
    const walletMatch = messageText.match(
      /^([1-9A-HJ-NP-Za-km-z]{32,44})\s+wants to sign in/m,
    );
    // Fallback: try the standard SIWS domain line format
    const domainMatch = messageText.match(
      /wants to sign in with.*\n\nAddress:\s*([1-9A-HJ-NP-Za-km-z]{32,44})/m,
    );

    const walletAddress = walletMatch?.[1] ?? domainMatch?.[1];

    if (!walletAddress) {
      return new Response(
        JSON.stringify({
          error: "Could not extract wallet address from SIWS message",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ── Upsert profile ───────────────────────────────────────────────────
    const { data: profile, error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        { wallet_address: walletAddress },
        { onConflict: "wallet_address" },
      )
      .select("id, wallet_address, display_name, avatar_url")
      .single();

    if (upsertError) {
      console.error("Profile upsert error:", upsertError);
      throw new Error("Failed to upsert profile");
    }

    // ── Generate Supabase-compatible JWT ─────────────────────────────────
    const signingKey = await getSigningKey();
    const now = Math.floor(Date.now() / 1000);

    const payload = {
      // Standard JWT claims
      iss: "supabase",
      sub: profile.id,
      aud: "authenticated",
      iat: getNumericDate(0), // now
      exp: getNumericDate(JWT_EXPIRY_HOURS * 60 * 60), // 24h from now
      // Supabase role claim
      role: "authenticated",
      // Custom claims for RLS policies
      wallet_address: walletAddress,
    };

    const token = await create(
      { alg: "HS256", typ: "JWT" },
      payload,
      signingKey,
    );

    return new Response(
      JSON.stringify({ token, profile }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("SIWS verification error:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
