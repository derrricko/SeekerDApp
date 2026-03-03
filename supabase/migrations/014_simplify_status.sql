-- Simplify donation status: replace hold_status/hold_expires_at with status (confirmed/completed).
-- Drop surplus columns (no longer needed for simple transaction model).

-- Drop hold constraint (added in migration 005/008)
ALTER TABLE donations DROP CONSTRAINT IF EXISTS chk_donations_hold_status;

-- Add new status column
ALTER TABLE donations ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'confirmed';

-- Migrate existing data
UPDATE donations SET status = CASE
  WHEN hold_status = 'released' THEN 'completed'
  ELSE 'confirmed'
END
WHERE hold_status IS NOT NULL;

-- Drop old columns
ALTER TABLE donations DROP COLUMN IF EXISTS hold_status;
ALTER TABLE donations DROP COLUMN IF EXISTS hold_expires_at;
ALTER TABLE donations DROP COLUMN IF EXISTS surplus_amount;
ALTER TABLE donations DROP COLUMN IF EXISTS surplus_status;

-- Add new constraint
ALTER TABLE donations ADD CONSTRAINT chk_donations_status
  CHECK (status IN ('confirmed', 'completed'));
