-- Idempotent bootstrap: migrations 001-007 were recorded as applied but tables
-- were never created on the remote. This migration creates everything from
-- scratch using IF NOT EXISTS, then applies the USDC-only schema fixes.
--
-- Glimpse only accepts USDC donations. SOL is never donated or used in-app
-- (only present in dev wallet for tx fees). amount_sol is a v1 relic.

-- ============================================================
-- 1. TABLES (from 001, with amount_sol made nullable)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.donations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_signature    text NOT NULL UNIQUE,
  donor_wallet    text NOT NULL,
  recipient_wallet text NOT NULL,
  recipient_id    text NOT NULL,
  amount_sol      numeric(18,9),            -- v1 legacy, nullable
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id  uuid NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
  donor_wallet text NOT NULL,
  admin_wallet text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_donation_unique UNIQUE (donation_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_wallet   text NOT NULL,
  body            text,
  media_url       text,
  media_type      text CHECK (media_type IN ('image', 'video', 'receipt')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDEXES (from 001)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_wallet);
CREATE INDEX IF NOT EXISTS idx_donations_tx ON public.donations(tx_signature);
CREATE INDEX IF NOT EXISTS idx_conversations_donor ON public.conversations(donor_wallet);
CREATE INDEX IF NOT EXISTS idx_conversations_admin ON public.conversations(admin_wallet);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- ============================================================
-- 3. RLS + current_wallet() (from 001 + 002)
-- ============================================================

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_wallet()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'wallet'
$$;

DROP POLICY IF EXISTS "Donors can read their donations" ON public.donations;
DROP POLICY IF EXISTS "Service role can insert donations" ON public.donations;
CREATE POLICY "Donors can read their donations"
  ON public.donations FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR donor_wallet = public.current_wallet()
    OR recipient_wallet = public.current_wallet()
  );
CREATE POLICY "Service role can insert donations"
  ON public.donations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Participants can read conversations" ON public.conversations;
DROP POLICY IF EXISTS "Service role can insert conversations" ON public.conversations;
CREATE POLICY "Participants can read conversations"
  ON public.conversations FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR donor_wallet = public.current_wallet()
    OR admin_wallet = public.current_wallet()
  );
CREATE POLICY "Service role can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.donor_wallet = public.current_wallet()
          OR c.admin_wallet = public.current_wallet()
        )
    )
  );
CREATE POLICY "Participants can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      sender_wallet = public.current_wallet()
      AND EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id = messages.conversation_id
          AND (
            c.donor_wallet = public.current_wallet()
            OR c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

-- ============================================================
-- 4. REALTIME (from 001)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END
$$;

-- ============================================================
-- 5. STORAGE (from 001 + 006: private bucket)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-media', 'chat-media', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Participants can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Participants can read chat media" ON storage.objects;
CREATE POLICY "Participants can upload chat media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id::text = split_part(name, '/', 1)
          AND (
            c.donor_wallet = public.current_wallet()
            OR c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

CREATE POLICY "Participants can read chat media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-media'
    AND (
      auth.role() = 'service_role'
      OR EXISTS (
        SELECT 1
        FROM public.conversations c
        WHERE c.id::text = split_part(name, '/', 1)
          AND (
            c.donor_wallet = public.current_wallet()
            OR c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

-- ============================================================
-- 6. v2 COLUMNS (from 004 + 005 + this migration)
-- ============================================================

-- Cadence (from 004)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'one_time';
DO $$ BEGIN
  ALTER TABLE public.donations
    ADD CONSTRAINT chk_donations_cadence CHECK (cadence IN ('one_time', 'daily'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Impact stage (from 004)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS impact_stage text NOT NULL DEFAULT 'processing';
DO $$ BEGIN
  ALTER TABLE public.donations
    ADD CONSTRAINT chk_donations_impact_stage CHECK (impact_stage IN ('processing', 'completed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_donations_stage ON public.donations(impact_stage);

-- USDC amount (from 005)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS amount_usdc numeric(18,6);

-- Donation mode (from 005)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donation_mode text NOT NULL DEFAULT 'solo';
DO $$ BEGIN
  ALTER TABLE public.donations
    ADD CONSTRAINT chk_donations_mode CHECK (donation_mode IN ('solo', 'group'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Hold status (from 005)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS hold_status text NOT NULL DEFAULT 'pending';
DO $$ BEGIN
  ALTER TABLE public.donations
    ADD CONSTRAINT chk_donations_hold_status
    CHECK (hold_status IN ('pending', 'locked', 'released'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_donations_hold_status ON public.donations(hold_status);

-- Cause preferences (from 005)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS cause_preferences jsonb DEFAULT '[]'::jsonb;

-- Hold expiry (NEW — edge function writes this but column never existed)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;

-- ============================================================
-- 7. AUTH CHALLENGES (from 003 + 007)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.auth_challenges (
  message    text PRIMARY KEY,
  wallet     text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_created_at
  ON public.auth_challenges(created_at);
ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;
-- No policies = deny all for anon/authenticated. service_role bypasses RLS.
