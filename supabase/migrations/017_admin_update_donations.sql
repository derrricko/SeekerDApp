-- Allow admin wallet to mark donations as completed.
-- WITH CHECK ensures status can only be set to 'completed'.
CREATE POLICY "Admin can complete donations"
  ON public.donations FOR UPDATE
  USING (public.current_wallet() = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk')
  WITH CHECK (status = 'completed');
