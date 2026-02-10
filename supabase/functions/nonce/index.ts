/**
 * Deno Edge Function: /nonce
 *
 * Generates a cryptographic nonce for SIWS (Sign-In With Solana) anti-replay
 * protection. The nonce is stored in the `nonces` table with a 5-minute TTL.
 *
 * Returns: { nonce: string }
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as encodeBase64 } from "https://deno.land/std@0.208.0/encoding/base64.ts";

const NONCE_TTL_MINUTES = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    // Initialize Supabase client with service role key for table writes
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a 32-byte cryptographic nonce
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const nonce = encodeBase64(randomBytes);

    // Calculate expiry (5 minutes from now)
    const expiresAt = new Date(
      Date.now() + NONCE_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    // Purge expired nonces to keep the table clean
    await supabase
      .from("nonces")
      .delete()
      .lt("expires_at", new Date().toISOString());

    // Store the nonce
    const { error: insertError } = await supabase
      .from("nonces")
      .insert({ nonce, expires_at: expiresAt });

    if (insertError) {
      console.error("Failed to store nonce:", insertError);
      throw new Error("Failed to store nonce");
    }

    return new Response(
      JSON.stringify({ nonce }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Nonce generation error:", err);

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
