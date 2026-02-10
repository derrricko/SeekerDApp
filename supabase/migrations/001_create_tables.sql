-- ============================================================================
-- 001_create_tables.sql
-- Core schema for Glimpse — needs-based charitable giving on Solana
-- ============================================================================

-- ─── Profiles ───────────────────────────────────────────────────────────────
-- Wallet-based user accounts. One row per unique Solana wallet.
CREATE TABLE profiles (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text        UNIQUE NOT NULL,
  display_name   text,
  avatar_url     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS 'Wallet-based user accounts linked via SIWS authentication';

-- ─── Needs ──────────────────────────────────────────────────────────────────
-- Fundable charitable needs. Each has a target amount and tracks progress.
CREATE TABLE needs (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    UNIQUE NOT NULL,
  title       text    NOT NULL,
  description text    NOT NULL,
  amount      numeric NOT NULL CHECK (amount > 0),
  funded      numeric NOT NULL DEFAULT 0 CHECK (funded >= 0),
  status      text    NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'funded', 'closed')),
  partner     text,
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE needs IS 'Verified charitable needs available for funding';

CREATE INDEX idx_needs_status ON needs (status);
CREATE INDEX idx_needs_slug   ON needs (slug);

-- ─── Transactions ───────────────────────────────────────────────────────────
-- On-chain donation records. Each maps a Solana tx to a need.
CREATE TABLE transactions (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text    NOT NULL,
  need_id        uuid    REFERENCES needs (id) ON DELETE SET NULL,
  tx_signature   text    UNIQUE NOT NULL,
  amount         numeric NOT NULL CHECK (amount > 0),
  created_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE transactions IS 'Donation records linked to on-chain Solana transactions';

CREATE INDEX idx_transactions_wallet ON transactions (wallet_address);
CREATE INDEX idx_transactions_need   ON transactions (need_id);

-- ─── Proofs ─────────────────────────────────────────────────────────────────
-- Media proving a need was fulfilled (photos, receipts, etc.)
CREATE TABLE proofs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id    uuid NOT NULL REFERENCES needs (id) ON DELETE CASCADE,
  media_url  text NOT NULL,
  media_type text NOT NULL DEFAULT 'image'
             CHECK (media_type IN ('image', 'video', 'receipt')),
  caption    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE proofs IS 'Media evidence that a funded need was fulfilled';

CREATE INDEX idx_proofs_need ON proofs (need_id);

-- ─── Nonces ─────────────────────────────────────────────────────────────────
-- Ephemeral nonces for SIWS (Sign-In With Solana) anti-replay.
CREATE TABLE nonces (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce      text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE nonces IS 'Ephemeral nonces for SIWS anti-replay protection';

CREATE INDEX idx_nonces_nonce      ON nonces (nonce);
CREATE INDEX idx_nonces_expires_at ON nonces (expires_at);

-- ─── updated_at trigger ─────────────────────────────────────────────────────
-- Automatically sets updated_at to now() on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_needs_updated_at
  BEFORE UPDATE ON needs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
