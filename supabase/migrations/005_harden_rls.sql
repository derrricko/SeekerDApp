-- ============================================================================
-- 005_harden_rls.sql
-- Remove the authenticated-user INSERT bypass on transactions.
-- All transaction inserts must go through the record-transaction edge function
-- (service role) which verifies on-chain data before recording.
-- ============================================================================

DROP POLICY IF EXISTS "transactions_insert_authenticated" ON transactions;
