-- Allow all authenticated users to read donations for the public feed.
-- Donation data (amount, wallet, status, tx_signature) is already public on-chain.
DROP POLICY IF EXISTS "Donors can read their donations" ON public.donations;
CREATE POLICY "Authenticated users can read donations"
  ON public.donations FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
  );
