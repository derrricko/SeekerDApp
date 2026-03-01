-- v2 USDC pivot: additive columns for USDC amount, hold tracking,
-- cause preferences, and donation mode.
--
-- IMPORTANT: This is an additive migration. The amount_sol column is
-- preserved for backward compatibility during the transition.

-- USDC amount (nullable during transition — new donations populate this)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_usdc numeric(18,6);

-- Donation mode: solo or group (metadata only — no routing difference)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donation_mode text NOT NULL DEFAULT 'solo';

DO $$ BEGIN
  ALTER TABLE public.donations
    ADD CONSTRAINT chk_donations_mode CHECK (donation_mode IN ('solo', 'group'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Hold tracking
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS hold_status text NOT NULL DEFAULT 'pending';

DO $$ BEGIN
  ALTER TABLE public.donations
    ADD CONSTRAINT chk_donations_hold_status
    CHECK (hold_status IN ('pending', 'locked', 'released'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Cause preferences (JSONB array of cause IDs, e.g. ["transportation","housing"])
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS cause_preferences jsonb DEFAULT '[]'::jsonb;

-- Index for admin hold queries
CREATE INDEX IF NOT EXISTS idx_donations_hold_status
  ON public.donations(hold_status);
