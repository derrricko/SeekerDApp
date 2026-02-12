-- ============================================================================
-- 006_atomic_nonce.sql
-- Atomic nonce consumption to prevent TOCTOU race conditions in SIWS auth
-- ============================================================================

CREATE OR REPLACE FUNCTION consume_nonce(p_nonce text)
RETURNS boolean AS $$
DECLARE v_expires_at timestamptz;
BEGIN
  DELETE FROM nonces WHERE nonce = p_nonce
  RETURNING expires_at INTO v_expires_at;
  IF v_expires_at IS NULL THEN RETURN false; END IF;
  IF v_expires_at < now() THEN RETURN false; END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql;
