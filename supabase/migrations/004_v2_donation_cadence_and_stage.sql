-- v2 donation metadata extension
-- Adds cadence + simple impact stage to support richer donor flow UI.

ALTER TABLE IF EXISTS public.donations
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'one_time';

ALTER TABLE IF EXISTS public.donations
  ADD CONSTRAINT chk_donations_cadence CHECK (cadence IN ('one_time', 'daily'));

ALTER TABLE IF EXISTS public.donations
  ADD COLUMN IF NOT EXISTS impact_stage text NOT NULL DEFAULT 'processing';

ALTER TABLE IF EXISTS public.donations
  ADD CONSTRAINT chk_donations_impact_stage CHECK (impact_stage IN ('processing', 'completed'));

CREATE INDEX IF NOT EXISTS idx_donations_stage
  ON public.donations(impact_stage);
