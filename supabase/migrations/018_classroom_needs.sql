-- ==========================================================
-- 018: Classroom Needs — tables, RLS, indexes, claim function
-- ==========================================================
-- Source: docs/plans/2026-03-09-classroom-needs-build-handoff.md
-- Corrections: docs/plans/2026-03-09-classroom-needs-claude-corrections.md

-- ==========================================================
-- classroom_needs: PUBLIC table — donor-visible fields only
-- ==========================================================
-- Admin-only fields live in classroom_need_admin (separate table)
-- to prevent data leaks via Realtime or direct SELECT. (Correction #1)

CREATE TABLE IF NOT EXISTS public.classroom_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_asin TEXT,
  image_url TEXT,
  price_usdc NUMERIC(10,2) NOT NULL CHECK (price_usdc > 0),
  teacher_first_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_city TEXT,
  school_state TEXT,
  teacher_identity_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','funded','under_review','purchased','delivered','classroom_photo_added','failed')),
  funded_by_wallet TEXT,
  funded_by_donation_id UUID REFERENCES public.donations(id),
  donor_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================
-- classroom_need_admin: SERVICE-ROLE ONLY — private fields
-- ==========================================================
-- Shipping address, admin notes, fulfillment data never exposed to clients.

CREATE TABLE IF NOT EXISTS public.classroom_need_admin (
  classroom_need_id UUID PRIMARY KEY REFERENCES public.classroom_needs(id) ON DELETE CASCADE,
  shipping_address JSONB NOT NULL,
  admin_review_notes TEXT,
  fulfillment_notes TEXT,
  proof_review_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One teacher can have one open request at a time.
-- Uses teacher_identity_key (stable identity from intake), NOT first name. (Correction #5)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_per_teacher
  ON public.classroom_needs (teacher_identity_key)
  WHERE status = 'open';

-- ==========================================================
-- purchase_orders: Sp3nd fulfillment tracking (admin-managed for hackathon)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_need_id UUID NOT NULL REFERENCES public.classroom_needs(id),
  donation_id UUID NOT NULL UNIQUE REFERENCES public.donations(id),
  sp3nd_cart_id TEXT,
  sp3nd_order_id TEXT,
  sp3nd_order_number TEXT,
  amount_usdc NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','cart_created','order_created','payment_sent','paid','ordered','shipped','delivered','failed')),
  error_message TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK on donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS classroom_need_id UUID REFERENCES public.classroom_needs(id);

-- ==========================================================
-- Indexes
-- ==========================================================

CREATE INDEX IF NOT EXISTS idx_classroom_needs_status ON public.classroom_needs(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_need ON public.purchase_orders(classroom_need_id);
CREATE INDEX IF NOT EXISTS idx_donations_classroom_need ON public.donations(classroom_need_id);

-- ==========================================================
-- RLS
-- ==========================================================

ALTER TABLE public.classroom_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_need_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- classroom_needs: NO public SELECT on base table.
-- Private fields (teacher_identity_key, funded_by_wallet, donor_note) live here
-- for constraints/operations but are never exposed to clients.
-- Public reads go through security-definer functions below.
CREATE POLICY "Service role manages classroom needs" ON public.classroom_needs
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- classroom_need_admin: service-role ONLY (never exposed to clients)
CREATE POLICY "Service role only on admin data" ON public.classroom_need_admin
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- purchase_orders: donor reads own, service_role writes
CREATE POLICY "Donors read own purchase orders" ON public.purchase_orders
  FOR SELECT USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.donations d
      WHERE d.id = purchase_orders.donation_id
        AND d.donor_wallet = public.current_wallet()
    )
  );

CREATE POLICY "Service role manages purchase orders" ON public.purchase_orders
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ==========================================================
-- Public read functions (security definer)
-- ==========================================================
-- Base table has NO public SELECT policy. These functions return
-- only donor-visible columns, hiding teacher_identity_key,
-- funded_by_wallet, funded_by_donation_id, donor_note, source_url,
-- and source_asin.

CREATE OR REPLACE FUNCTION public.get_classroom_needs_public()
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  price_usdc NUMERIC(10,2),
  teacher_first_name TEXT,
  school_name TEXT,
  school_city TEXT,
  school_state TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, title, description, image_url, price_usdc,
         teacher_first_name, school_name, school_city, school_state,
         status, created_at, updated_at
  FROM public.classroom_needs
  ORDER BY
    CASE WHEN status = 'open' THEN 0 ELSE 1 END,
    created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_classroom_need_by_id(p_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  image_url TEXT,
  price_usdc NUMERIC(10,2),
  teacher_first_name TEXT,
  school_name TEXT,
  school_city TEXT,
  school_state TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id, title, description, image_url, price_usdc,
         teacher_first_name, school_name, school_city, school_state,
         status, created_at, updated_at
  FROM public.classroom_needs
  WHERE classroom_needs.id = p_id;
$$;

-- ==========================================================
-- Idempotent need claim function (Correction #3)
-- ==========================================================
-- Prevents false conflicts when dual recording (client + webhook)
-- processes the same donation for the same need.

CREATE OR REPLACE FUNCTION public.claim_classroom_need(
  p_need_id UUID,
  p_donation_id UUID,
  p_donor_wallet TEXT
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status TEXT;
  v_existing_donation_id UUID;
BEGIN
  -- Lock the row to prevent concurrent claims
  SELECT status, funded_by_donation_id
    INTO v_status, v_existing_donation_id
    FROM public.classroom_needs
    WHERE id = p_need_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  -- Already funded by the same donation (replay from dual recording) → success
  IF v_status != 'open' AND v_existing_donation_id = p_donation_id THEN
    RETURN 'already_claimed_same';
  END IF;

  -- Already funded by a different donation → real conflict
  IF v_status != 'open' THEN
    RETURN 'conflict';
  END IF;

  -- Claim it
  UPDATE public.classroom_needs
    SET status = 'funded',
        funded_by_wallet = p_donor_wallet,
        funded_by_donation_id = p_donation_id,
        updated_at = now()
    WHERE id = p_need_id;

  RETURN 'claimed';
END;
$$;
