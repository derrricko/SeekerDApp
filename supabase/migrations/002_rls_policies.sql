-- ============================================================================
-- 002_rls_policies.sql
-- Row-Level Security policies for Glimpse
-- ============================================================================

-- ─── Enable RLS on all tables ───────────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE nonces       ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════
-- Profiles
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone can read profiles (public donor info)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- Only the wallet owner can update their own profile.
-- The JWT contains a wallet_address claim injected during SIWS verification.
CREATE POLICY "profiles_update_owner"
  ON profiles FOR UPDATE
  USING (
    auth.jwt() ->> 'wallet_address' = wallet_address
  )
  WITH CHECK (
    auth.jwt() ->> 'wallet_address' = wallet_address
  );

-- Profile rows are created by the siws-verify edge function (service role).
-- Authenticated users cannot insert arbitrary profiles.
CREATE POLICY "profiles_insert_service"
  ON profiles FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Needs
-- ═══════════════════════════════════════════════════════════════════════════

-- Anyone can read needs (public catalog)
CREATE POLICY "needs_select_public"
  ON needs FOR SELECT
  USING (true);

-- Only service role can manage needs
CREATE POLICY "needs_insert_service"
  ON needs FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

CREATE POLICY "needs_update_service"
  ON needs FOR UPDATE
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

CREATE POLICY "needs_delete_service"
  ON needs FOR DELETE
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Transactions
-- ═══════════════════════════════════════════════════════════════════════════

-- Public read — full transparency on all donations
CREATE POLICY "transactions_select_public"
  ON transactions FOR SELECT
  USING (true);

-- Only service role can insert transactions (after on-chain verification)
CREATE POLICY "transactions_insert_service"
  ON transactions FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Proofs
-- ═══════════════════════════════════════════════════════════════════════════

-- Public read — anyone can see fulfillment proofs
CREATE POLICY "proofs_select_public"
  ON proofs FOR SELECT
  USING (true);

-- Only service role can insert proofs
CREATE POLICY "proofs_insert_service"
  ON proofs FOR INSERT
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Nonces
-- ═══════════════════════════════════════════════════════════════════════════

-- Nonces are managed exclusively by edge functions via service role.
-- No public access whatsoever.
CREATE POLICY "nonces_service_only"
  ON nonces FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'service_role'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- Storage: proof-media bucket
-- ═══════════════════════════════════════════════════════════════════════════

-- Create a public bucket for proof media (images, videos, receipts)
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-media', 'proof-media', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view proof media (public transparency)
CREATE POLICY "proof_media_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-media');

-- Only service role can upload proof media
CREATE POLICY "proof_media_insert_service"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'proof-media'
    AND (auth.jwt() ->> 'role') = 'service_role'
  );

-- Only service role can update proof media
CREATE POLICY "proof_media_update_service"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'proof-media'
    AND (auth.jwt() ->> 'role') = 'service_role'
  )
  WITH CHECK (
    bucket_id = 'proof-media'
    AND (auth.jwt() ->> 'role') = 'service_role'
  );

-- Only service role can delete proof media
CREATE POLICY "proof_media_delete_service"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'proof-media'
    AND (auth.jwt() ->> 'role') = 'service_role'
  );
