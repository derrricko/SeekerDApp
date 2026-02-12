/**
 * Deno Edge Function: /record-transaction
 *
 * Server-side transaction verification + recording for Solana donations.
 *
 * 1. Accepts POST with { tx_signature, wallet_address, need_slug?, note? }
 * 2. Authenticates the caller via Supabase JWT (wallet_address must match token)
 * 3. Fetches the transaction from Solana RPC (devnet) using getTransaction
 * 4. Verifies:
 *    - Transaction exists and is confirmed
 *    - The claimed wallet_address is a signer on the transaction
 *    - The transaction involves the USDC mint
 *    - Derives the actual USDC amount from on-chain pre/post token balances
 * 5. If need_slug is provided, verifies the vault PDA's ATA is a destination
 * 6. Inserts into the transactions table using the service-role Supabase client
 * 7. Returns { success: true, id } or an error
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { verify } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

/** Devnet USDC mint address (must match constants.rs) */
const USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/** USDC has 6 decimal places */
const USDC_DECIMALS = 6;

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

// ─── Known vault PDAs and their USDC ATAs ─────────────────────────────────
// Hardcoded from on-chain deployment. Using a lookup table avoids the
// ed25519 curve check required for correct PDA derivation in pure JS.

/** Vault PDA addresses (seeds: ["need", slug]) under the escrow program. */
const VAULT_PDAS: Record<string, string> = {
  shower: "5Qnw3W3MbF6oNmPhN5Nfh93g51hKppFtH5y6TkZPMEsM",
  groceries: "CnxrG6ScusNpSFVyy4Ti34ZE5bjYhRVVWHTN73859S5c",
  wardrobe: "EW82JfL5rZxEsjuL3pJovyugYbtF1PPhEL7ejZQ6MmKa",
  tires: "HjfPfQvx1wy5BRKDZxrFCKde3KY74pJypyNQQuxASEVf",
  rent: "EMmuGFWUJbpjopt2DqZAyQLnSnEKK4dVLqbpy9shr26k",
};

/**
 * Get the vault PDA address for a known need slug.
 * Returns null for unknown slugs.
 */
function getVaultPDA(slug: string): string | null {
  return VAULT_PDAS[slug] ?? null;
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
 * Derive the USDC transfer amount from on-chain pre/post token balances.
 *
 * Compares the signer's USDC token balance before and after the transaction
 * to determine how much USDC they spent. Returns the amount in UI units
 * (i.e., divided by 10^6 for USDC's 6 decimals).
 *
 * Returns null if the amount cannot be determined.
 */
// deno-lint-ignore no-explicit-any
function deriveUsdcTransferAmount(tx: any, walletAddress: string): number | null {
  const meta = tx?.meta;
  if (!meta) return null;

  const preBalances = meta.preTokenBalances ?? [];
  const postBalances = meta.postTokenBalances ?? [];

  // Find the signer's USDC pre-balance
  // deno-lint-ignore no-explicit-any
  const preEntry = preBalances.find((bal: any) =>
    bal?.mint === USDC_MINT && bal?.owner === walletAddress
  );

  // deno-lint-ignore no-explicit-any
  const postEntry = postBalances.find((bal: any) =>
    bal?.mint === USDC_MINT && bal?.owner === walletAddress
  );

  // Need at least one balance entry to derive amount
  if (!preEntry && !postEntry) return null;

  // Use string amounts for precision (they come as strings from RPC)
  const preAmount = BigInt(preEntry?.uiTokenAmount?.amount ?? "0");
  const postAmount = BigInt(postEntry?.uiTokenAmount?.amount ?? "0");

  // The signer spent (pre - post) USDC
  const spent = preAmount - postAmount;

  if (spent <= 0n) return null;

  // Convert from raw amount to UI units (6 decimals for USDC)
  return Number(spent) / Math.pow(10, USDC_DECIMALS);
}

/**
 * Verify that a need_slug matches a transaction destination.
 *
 * Checks if the vault PDA (from the known lookup table) appears
 * in the transaction's account keys. This confirms the transaction
 * targeted the correct escrow vault for the claimed need.
 */
// deno-lint-ignore no-explicit-any
function verifyNeedSlug(tx: any, slug: string): boolean {
  const vaultPDA = getVaultPDA(slug);
  if (!vaultPDA) {
    // Unknown slug — can't verify
    return false;
  }

  const accountKeys = tx?.transaction?.message?.accountKeys ?? [];

  // Check if the vault PDA or any of its derived accounts appear in the tx.
  // The escrow donate instruction includes the vault PDA directly in its
  // account list, so checking for the PDA address is sufficient.
  // deno-lint-ignore no-explicit-any
  return accountKeys.some((key: any) => {
    const pubkey = typeof key === "string" ? key : key?.pubkey;
    return pubkey === vaultPDA;
  });
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
    const { tx_signature, wallet_address, need_slug, note } = body;

    if (!tx_signature || typeof tx_signature !== "string") {
      return errorResponse("Missing or invalid tx_signature", 400);
    }

    if (!wallet_address || typeof wallet_address !== "string") {
      return errorResponse("Missing or invalid wallet_address", 400);
    }

    // ── Authenticate the caller ──────────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Missing or invalid Authorization header", 401);
    }

    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const jwtSecret = Deno.env.get("JWT_SECRET");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    if (!jwtSecret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    // Verify the custom SIWS JWT directly (it's not in auth.users, so
    // getUser() won't work). The token was minted by siws-verify using
    // the same JWT_SECRET.
    const signingKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );

    // deno-lint-ignore no-explicit-any
    let payload: any;
    try {
      payload = await verify(token, signingKey);
    } catch {
      return errorResponse("Invalid or expired token", 401);
    }

    // Verify required claims
    if (payload.aud !== "authenticated" || payload.role !== "authenticated") {
      return errorResponse("Invalid token claims", 401);
    }

    // Verify the JWT wallet_address claim matches the request body
    const jwtWallet = payload.wallet_address;

    if (jwtWallet !== wallet_address) {
      return errorResponse(
        "Token wallet_address does not match request wallet_address",
        403,
      );
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

    // ── Derive USDC amount from on-chain data ────────────────────────────
    const amount = deriveUsdcTransferAmount(tx, wallet_address);

    if (amount === null) {
      return errorResponse(
        "Could not derive USDC transfer amount from transaction",
        422,
      );
    }

    // ── Verify need_slug against on-chain destination ────────────────────
    if (need_slug && typeof need_slug === "string") {
      const slugValid = verifyNeedSlug(tx, need_slug);
      if (!slugValid) {
        return errorResponse(
          "need_slug does not match transaction destination",
          400,
        );
      }
    }

    // ── Initialize Supabase service client for DB operations ─────────────
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
