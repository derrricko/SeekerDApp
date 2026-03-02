-- Surplus tracking for donation overages.
-- All surplus goes to the community pool (fixed policy, no donor choice).
-- Admin sets surplus_amount when matching a donation to a specific need.

ALTER TABLE donations
  ADD COLUMN surplus_amount numeric(18,6) DEFAULT NULL,
  ADD COLUMN surplus_status text DEFAULT NULL
    CHECK (surplus_status IN ('pending', 'completed'));
