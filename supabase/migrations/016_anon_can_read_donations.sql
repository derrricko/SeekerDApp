-- Allow anon role to read donations for the public feed.
-- The feed loads before wallet-auth completes, so the initial query runs as anon.
-- Donation data (amount, wallet, status, tx_signature) is already public on-chain.
DROP POLICY IF EXISTS "Authenticated users can read donations" ON public.donations;
CREATE POLICY "Anyone can read donations"
  ON public.donations FOR SELECT
  USING (true);
