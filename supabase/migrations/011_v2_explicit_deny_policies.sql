-- Explicit deny-all UPDATE/DELETE policies on core tables.
-- PostgreSQL RLS implicitly denies operations without a matching policy,
-- but explicit deny policies make the security posture declarative and
-- prevent accidental exposure if a permissive policy is added later.

CREATE POLICY "No updates to donations"
  ON public.donations FOR UPDATE USING (false);

CREATE POLICY "No deletes on donations"
  ON public.donations FOR DELETE USING (false);

CREATE POLICY "No updates to conversations"
  ON public.conversations FOR UPDATE USING (false);

CREATE POLICY "No deletes on conversations"
  ON public.conversations FOR DELETE USING (false);

CREATE POLICY "No updates to messages"
  ON public.messages FOR UPDATE USING (false);

CREATE POLICY "No deletes on messages"
  ON public.messages FOR DELETE USING (false);
