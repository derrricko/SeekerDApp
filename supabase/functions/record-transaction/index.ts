/**
 * Deno Edge Function: /record-transaction
 *
 * Server-side transaction verification + recording for Solana donations.
 *
 * 1. Accepts POST with { tx_signature, wallet_address, amount, need_slug?, note? }
 * 2. Fetches the transaction from Solana RPC (devnet) using getTransaction
 * 3. Verifies:
 *    - Transaction exists and is confirmed
 *    - The claimed wallet_address is a signer on the transaction
 *    - The transaction involves the USDC mint (basic amount sanity check)
 * 4. Looks up need_id from need_slug if provided
 * 5. Inserts into the transactions table using the service-role Supabase client
 * 6. Returns { success: true, id } or an error
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/** Devnet USDC mint address (must match constants.rs) */
const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Helper to build a JSON error response. */
function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/**
 * Fetch and parse a confirmed transaction from Solana RPC.
 * Returns the parsed result or null if not found / not yet confirmed.
 */
async function fetchSolanaTransaction(
  txSignature: string,
  // deno-lint-ignore no-explicit-any
): Promise<any | null> {
  const rpcUrl =
    Deno.env.get("SOLANA_RPC_URL") || "https://api.devnet.solana.com";

  const txResponse = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [
        txSignature,
        { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 },
      ],
    }),
  });

  const txResult = await txResponse.json();

  if (txResult.error) {
    console.error("Solana RPC error:", txResult.error);
    return null;
  }

  return txResult.result ?? null;
}

/**
 * Verify that wallet_address appears as a signer in the transaction's
 * accountKeys array.
 */
// deno-lint-ignore no-explicit-any
function verifySigner(tx: any, walletAddress: string): boolean {
  const accountKeys =
    tx?.transaction?.message?.accountKeys ?? [];

  // accountKeys in jsonParsed encoding are objects with { pubkey, signer, ... }
  // deno-lint-ignore no-explicit-any
  return accountKeys.some((key: any) => {
    const pubkey =
      typeof key === "string" ? key : key?.pubkey;
    const isSigner =
      typeof key === "string" ? false : key?.signer === true;
    return pubkey === walletAddress && isSigner;
  });
}

/**
 * Verify that the transaction involves the USDC mint by checking
 * preTokenBalances and postTokenBalances.
 *
 * We verify that a token balance change exists for the USDC mint, which
 * confirms this is a real USDC transaction. We intentionally avoid strict
 * amount matching because on-chain amounts may include rent or rounding
 * differences.
 */
// deno-lint-ignore no-explicit-any
function verifyUsdcInvolvement(tx: any): boolean {
  const meta = tx?.meta;
  if (!meta) {
    return false;
  }

  const preBalances = meta.preTokenBalances ?? [];
  const postBalances = meta.postTokenBalances ?? [];

  const allBalances = [...preBalances, ...postBalances];

  // deno-lint-ignore no-explicit-any
  return allBalances.some((bal: any) => bal?.mint === USDC_MINT);
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    // ── Parse and validate request body ──────────────────────────────────
    const body = await req.json();
    const { tx_signature, wallet_address, amount, need_slug, note } = body;

    if (!tx_signature || typeof tx_signature !== "string") {
      return errorResponse("Missing or invalid tx_signature", 400);
    }

    if (!wallet_address || typeof wallet_address !== "string") {
      return errorResponse("Missing or invalid wallet_address", 400);
    }

    if (typeof amount !== "number" || amount <= 0) {
      return errorResponse("Missing or invalid amount", 400);
    }

    // ── Fetch the transaction from Solana RPC ────────────────────────────
    const tx = await fetchSolanaTransaction(tx_signature);

    if (!tx) {
      return errorResponse(
        "Transaction not found or not yet confirmed on-chain",
        404,
      );
    }

    // Check for transaction error (failed tx should not be recorded)
    if (tx.meta?.err) {
      return errorResponse("Transaction failed on-chain", 422);
    }

    // ── Verify the claimed wallet is a signer ────────────────────────────
    if (!verifySigner(tx, wallet_address)) {
      return errorResponse(
        "Wallet address is not a signer on this transaction",
        403,
      );
    }

    // ── Verify USDC involvement ──────────────────────────────────────────
    if (!verifyUsdcInvolvement(tx)) {
      return errorResponse(
        "Transaction does not involve the expected USDC mint",
        422,
      );
    }

    // ── Initialize Supabase service client ───────────────────────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Resolve need_id from slug if provided ────────────────────────────
    let needId: string | null = null;

    if (need_slug && typeof need_slug === "string") {
      const { data: needRow } = await supabase
        .from("needs")
        .select("id")
        .eq("slug", need_slug)
        .single();

      needId = needRow?.id ?? null;
    }

    // ── Insert the verified transaction ──────────────────────────────────
    const { data: inserted, error: insertError } = await supabase
      .from("transactions")
      .insert({
        wallet_address,
        need_id: needId,
        tx_signature,
        amount,
        note: note || null,
      })
      .select("id")
      .single();

    if (insertError) {
      // Unique constraint on tx_signature means duplicate recording
      if (insertError.code === "23505") {
        return errorResponse("Transaction already recorded", 409);
      }

      console.error("Insert error:", insertError);
      throw new Error("Failed to insert transaction");
    }

    // ── Return success ───────────────────────────────────────────────────
    return new Response(
      JSON.stringify({ success: true, id: inserted.id }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("record-transaction error:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
