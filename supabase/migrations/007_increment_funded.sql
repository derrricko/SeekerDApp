-- ============================================================================
-- 007_increment_funded.sql
-- Atomic increment of needs.funded counter after donation recording
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_funded(slug_param text, amount_param numeric)
RETURNS void AS $$
  UPDATE needs SET funded = funded + amount_param WHERE slug = slug_param;
$$ LANGUAGE sql;
