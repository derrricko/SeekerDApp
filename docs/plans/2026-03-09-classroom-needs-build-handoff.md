# Classroom Needs — Claude Code Build Handoff

**Date:** 2026-03-09
**Source docs:**
- Design brief: `docs/plans/2026-03-09-public-school-needs-design-brief.md`
- Layout spec: `docs/plans/2026-03-09-public-school-needs-layout-spec.md`
- Architecture: `docs/plans/2026-03-08-classroom-needs-design.md`
- Codex handoff (context): `docs/handoffs/2026-03-08-codex-classroom-needs-handoff.md`

**Skills to load:** `solana-seeker-dev`, `interface-design`, `interaction-design`
**Audit agent:** Codex reviews implementation after build

---

## Non-Negotiable Guardrails

These are product rules. Violating any of them is a build failure.

1. **No dropdown UX.** Donors browse a need feed. They do not select campaigns from a dropdown.
2. **One donor, one need.** No pooling, no partial funding.
3. **Need locks immediately** after confirmed funding. A funded need must never remain fundable.
4. **Need mode feels distinct.** The Give screen in need mode must not look like the general donation form with different labels.
5. **No Amazon branding.** Amazon is a fulfillment source, not product identity. No outbound Amazon links on primary surfaces.
6. **No guaranteed teacher reply.** Copy must say "shared when the teacher sends them," never "you will receive."
7. **Single-column feed.** No grid layout. Editorial, not marketplace.
8. **NEEDS is the default first view** on the Glimpses tab.
9. **Admin review is explicit** in UI and data — "Under Review" is a real state between Funded and Purchased.

---

## State Machine (Locked)

```
OPEN → FUNDED → UNDER_REVIEW → PURCHASED → DELIVERED → CLASSROOM_PHOTO_ADDED
                                    ↘ FAILED (error path)
```

### Donor-facing labels and colors

| State | Label | Chip Color |
|-------|-------|------------|
| `open` | `OPEN` | Purple text / light action tint (`accent` + 10% bg) |
| `funded` | `FUNDED` | Muted neutral (`textTertiary` on `surfaceMuted`) |
| `under_review` | `UNDER REVIEW` | Muted neutral with subtle border |
| `purchased` | `PURCHASED` | Teal-assisted emphasis (`teal` bg tint) |
| `delivered` | `DELIVERED` | Teal (`teal` bg) |
| `classroom_photo_added` | `CLASSROOM PHOTO ADDED` | Teal + image badge |
| `failed` | `ISSUE` | Muted, never red unless actual failure |

### State transitions (who triggers)

| From | To | Triggered by |
|------|-----|-------------|
| `open` | `funded` | `record-donation` edge fn (after confirmed USDC tx) |
| `funded` | `under_review` | Automatic (immediate after funded, or admin action) |
| `under_review` | `purchased` | Admin (manual — verifies then purchases via Sp3nd consumer app) |
| `purchased` | `delivered` | Admin (manual — based on Amazon/Sp3nd delivery tracking) |
| `delivered` | `classroom_photo_added` | Admin (uploads teacher photo) |
| any | `failed` | Admin (manual — item unavailable, price changed, etc.) |

---

## File-by-File Build Scope

### 1. New Migration: `supabase/migrations/018_classroom_needs.sql`

```sql
-- ==========================================================
-- classroom_needs: PUBLIC table — donor-visible fields only
-- ==========================================================
-- Correction: admin-only fields live in classroom_need_admin (separate table)
-- to prevent data leaks via Realtime or direct SELECT. (Codex correction #1)

CREATE TABLE IF NOT EXISTS public.classroom_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT NOT NULL,      -- renamed from amazon_url (no Amazon branding)
  source_asin TEXT,              -- renamed from asin
  image_url TEXT,
  price_usdc NUMERIC(10,2) NOT NULL CHECK (price_usdc > 0),
  teacher_first_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_city TEXT,
  school_state TEXT,
  teacher_identity_key TEXT NOT NULL,  -- stable key from intake form (email hash, form ID, etc.)
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

-- Enforce: one teacher can have one open request at a time (brief §4, rule 2)
-- Uses teacher_identity_key (stable identity from intake), NOT first name.
-- (Codex correction #5)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_per_teacher
  ON public.classroom_needs (teacher_identity_key)
  WHERE status = 'open';

-- ==========================================================
-- purchase_orders: Sp3nd fulfillment tracking (admin-managed for hackathon)
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_need_id UUID NOT NULL REFERENCES public.classroom_needs(id),
  donation_id UUID NOT NULL REFERENCES public.donations(id),
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

-- classroom_needs: public read (no sensitive data on this table)
CREATE POLICY "Anyone can read classroom needs" ON public.classroom_needs
  FOR SELECT USING (true);

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
-- Realtime
-- ==========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'classroom_needs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.classroom_needs;
  END IF;
END $$;

-- ==========================================================
-- Idempotent need claim function (Codex correction #3)
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
```

**Deploy:** `supabase db push` or `supabase migration up`

---

### 2. `config/donationConfig.ts` — Add classroom-needs campaign

Add to `CAMPAIGN_OPTIONS`:
```typescript
{
  id: 'classroom-needs',
  label: 'Classroom Need',
  glimpseTag: '#004',
  summary: 'Fund a specific item a public school teacher requested.',
  causePreferences: ['education', 'classroom-needs'],
  minimumUSDC: 1,  // Individual items can be cheap
}
```

Add `'classroom-needs'` and `'education'` to `ALLOWED_CAUSE_PREFERENCES` in the server-side `record-donation` edge fn.

Add `NeedStatus` type:
```typescript
export type NeedStatus = 'open' | 'funded' | 'under_review' | 'purchased' | 'delivered' | 'classroom_photo_added' | 'failed';

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  open: 'OPEN',
  funded: 'FUNDED',
  under_review: 'UNDER REVIEW',
  purchased: 'PURCHASED',
  delivered: 'DELIVERED',
  classroom_photo_added: 'CLASSROOM PHOTO ADDED',
  failed: 'ISSUE',
};
```

---

### 3. New Service: `services/classroomNeeds.ts`

```typescript
export interface ClassroomNeed {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_usdc: number;
  teacher_first_name: string;
  school_name: string;
  school_city: string | null;
  school_state: string | null;
  status: NeedStatus;
  funded_by_wallet: string | null;
  donor_note: string | null;
  created_at: string;
}

export async function fetchClassroomNeeds(): Promise<ClassroomNeed[]>
// Fetch all needs, ordered: open first, then by created_at desc
// Uses supabase anon client (public read via RLS)
// Admin-only data lives in classroom_need_admin (separate table, service_role only)
// so no column filtering needed here — the public table is clean.

export async function fetchClassroomNeedById(id: string): Promise<ClassroomNeed | null>
// Single need detail
```

---

### 4. `utils/transfer.ts` — Add `cn` field to memo

Add optional `classroomNeedId?: string` param to `buildDonationTransaction()`.

If present, add `cn: classroomNeedId` (**full UUID**, not truncated) to memo JSON object. A UUID is 36 chars — existing memo is ~100 bytes, so total stays well within 566-byte limit. Do not truncate the identity key. (Codex correction #2)

---

### 5. `services/donations.ts` — Thread classroomNeedId

Add optional `classroomNeedId?: string` param to `executeDonationSeamless()`. Thread through:
- `confirmAndRecord()`
- `recordAndCreateConversationSecure()` → add to POST body
- `addPendingConversation()` → add to `PendingConversation` interface

---

### 6. `utils/retry.ts` — Add classroomNeedId to PendingConversation

```typescript
export interface PendingConversation {
  // ... existing fields
  classroomNeedId?: string;  // NEW
}
```

---

### 7. `supabase/functions/record-donation/index.ts` — Accept classroomNeedId

Changes:
1. Parse `classroomNeedId` from request body (optional string, must be valid UUID)
2. If present:
   - Bypass `resolveCampaignFromCauses`. Use `recipientId = 'classroom-needs'` directly.
   - Fetch the classroom need from DB, confirm `status = 'open'`
   - **Exact amount match (Codex correction #4):** Validate `amountUSDC == need.price_usdc` (±1 microUSDC tolerance for float rounding only). Do not allow overpayment — the product promise is "fund exactly what a teacher asked for."
3. After successful donation upsert:
   - **Idempotent atomic claim (Codex correction #3):** Call `SELECT public.claim_classroom_need(classroomNeedId, donationId, donorWallet)`:
     - `'claimed'` → success, proceed
     - `'already_claimed_same'` → same donation replayed (dual recording), treat as success
     - `'conflict'` → different donor already funded → return 409 Conflict
     - `'not_found'` → invalid need ID → return 404
   - Insert `purchase_orders` row with status `'pending'`
4. Store `classroom_need_id` on the donation row
5. Welcome message copy for needs: `"Your funding for '{title}' is confirmed on-chain. Glimpse is now reviewing the request before purchase. We'll update this thread with purchase proof, shipping, and delivery."`

---

### 8. `supabase/functions/helius-webhook/index.ts` — Detect cn field

In `extractGlimpseMemo()`: if parsed memo has `cn` field (full UUID), return it.

In `processTransaction()`: if memo has `cn`:
- Set `classroom_need_id` on the donation insert
- Call `claim_classroom_need(cn, donationId, donorWallet)` — same idempotent RPC function used by `record-donation`. If result is `'already_claimed_same'`, treat as success (dual recording replay). If `'conflict'`, log warning but still record the donation (funds are on-chain regardless).

---

### 9. Sp3nd Auto-Purchase — DEFERRED (Post-Hackathon)

**Full Sp3nd automation is explicitly deferred from hackathon scope** (per design brief §15).

The hackathon flow is:
```
Donor funds → FUNDED → UNDER REVIEW (admin manually verifies) →
admin manually purchases via Sp3nd consumer app →
admin updates status + posts proof → PURCHASED → DELIVERED
```

Admin manages fulfillment via Supabase dashboard:
- Update `classroom_needs.status` to `purchased`, `delivered`, etc.
- Insert proof messages into the conversation thread manually
- Upload receipt screenshots via chat-media storage bucket

**The `purchase_orders` table is still created** (migration 018) to track fulfillment, but rows are managed manually by admin, not by an automated edge function. This preserves the schema for post-hackathon Sp3nd automation.

**Post-hackathon:** Build `trigger-purchase` edge function with Sp3nd x402 integration. Architecture design exists in `docs/plans/2026-03-08-classroom-needs-design.md`.

---

### 10. `navigation/AppNavigator.tsx` — Route params

Update type:
```typescript
export type RootTabParamList = {
  Glimpses: undefined;
  Give: { classroomNeedId?: string; prefillAmount?: number; needTitle?: string; needImage?: string; teacherName?: string; schoolName?: string } | undefined;
  Messages: { conversationId?: string; demoMode?: boolean } | undefined;
  Rank: undefined;
};
```

No tab bar visual changes needed.

---

### 11. `screens/CampaignsScreen.tsx` — Major changes

**ViewMode expansion:**
```typescript
type ViewMode = 'needs' | 'feed' | 'my_glimpses';
// Default: 'needs' (was 'feed')
const [viewMode, setViewMode] = useState<ViewMode>('needs');
```

**Toggle pills:** 3 pills: `NEEDS | FEED | MY GLIMPSES`
- Sliding active pill indicator (180-220ms ease-out)

**Needs mode content structure:**
1. One-line explainer: `"Requests come directly from public school teachers. Every funded need is reviewed before purchase."`
2. **OPEN NEEDS** section header + list of `NeedCard` components
3. **IN MOTION** section header + list (funded/under_review/purchased needs)
4. **DELIVERED** section header + list (delivered/classroom_photo_added needs)

**NeedCard component** (new, inline or extracted to `ui/NeedCard.tsx`):
- Per layout spec wireframe (line 136-149 of layout spec)
- Image (16:9, fixed height, `resizeMode: 'cover'`)
- Price (Cormorant Garamond, largest element) + status chip (Courier Prime, uppercase)
- Title (Cormorant Garamond)
- Teacher + school line (Courier Prime)
- City/state line (Courier Prime)
- Teacher excerpt (3-line cap, Courier Prime)
- CTA button: `FUND THIS` (open), `VIEW STATUS` (in motion), `VIEW PROOF` (delivered)

**Card layout constraints (layout spec §3):**
- No more than 2 lines of metadata per card row before wrapping to next block
- Fixed image height (e.g., 200px) to prevent content jump on load
- Reserve image space with placeholder background color

**Card press:** scale to 0.98, 100-120ms

**Status chip update motion:** 160-200ms opacity/translate combo

**Delivered card extras:**
- Optional small classroom-photo badge if `status = 'classroom_photo_added'`
- Proof line (e.g., "Receipt added" or "Delivered Jan 15")

**Empty state (when no open needs):**
`"No open needs right now. Delivered needs and proof remain below."`

**Tap behavior:**
- Open needs → navigate to NeedDetail screen (full screen, not sheet)
- In-motion/delivered → navigate to Messages thread (proof timeline)

---

### 12. New Screen: `screens/NeedDetailScreen.tsx`

Full-screen detail view (not a sheet). Per layout spec line 189-246.

**Layout order:**
1. Back button + "Need" header
2. Hero image (large)
3. Amount + status row ($XX.XX + status chip)
4. Title (Cormorant Garamond)
5. Teacher identity block (name, school, city/state)
6. "WHY THIS CLASSROOM NEEDS IT" section header (Courier Prime)
7. Full teacher explanation
8. "WHAT HAPPENS NEXT" section header (Courier Prime)
9. Copy: "Purchase proof is guaranteed. Classroom updates are shared when the teacher sends them."
10. Optional: "Reviewed by Glimpse before purchase" trust line
11. Sticky bottom CTA: `FUND THIS NEED` (purple accent, full width)

**Transition in:** 220-260ms fade + slight upward settle

**CTA navigates to:** `Give` tab with params:
```typescript
navigation.navigate('Give', {
  classroomNeedId: need.id,
  prefillAmount: need.price_usdc,
  needTitle: need.title,
  needImage: need.image_url,
  teacherName: need.teacher_first_name,
  schoolName: need.school_name,
});
```

**Register in navigator:** Add to a stack navigator nested inside the Glimpses tab, or use `navigation.navigate` to a modal screen. Simplest: use `@react-navigation/native-stack` for a Glimpses stack.

---

### 13. `screens/GiveScreen.tsx` — Need Mode

**Read route params:**
```typescript
const route = useRoute<RouteProp<RootTabParamList, 'Give'>>();
const needParams = route.params;
const isNeedMode = !!needParams?.classroomNeedId;
```

**When `isNeedMode`:**
- **Hide:** campaign dropdown, quick amount chips, open amount entry, campaign summary
- **Show:** pinned summary card at top with:
  - Thumbnail image (48x48 or 64x64)
  - Item title
  - Teacher + school
  - Exact amount (locked, not editable)
  - Trust line: "Funding this need opens a proof timeline in Messages."
- **Keep:** optional donor note field ("ADD A NOTE")
- **Keep:** confirm step (reads like a receipt review: item, teacher, amount, note preview). CTA label: `CONFIRM & SIGN` (not "Confirm Donation")
- **Keep:** processing step with different copy:
  - Heading: `NEED FUNDED` (not "Donation Confirmed")
  - Body: `Glimpse is now reviewing this request before purchase.`
  - Primary CTA: `VIEW PROOF THREAD` (navigates to Messages with conversationId)
  - Secondary CTA: `BACK TO NEEDS` (navigates to Glimpses tab)

**Donation call:**
```typescript
await executeDonationSeamless(
  connection,
  MATCHING_POOL.wallet,
  'classroom-needs',     // recipientId
  needParams.prefillAmount,
  'one_time',            // cadence always one_time for needs
  authorizeSignAndBuildTransaction,
  ['education', 'classroom-needs'],  // causePreferences
  'solo',                // donationMode
  needParams.classroomNeedId,  // NEW param
);
```

---

### 14. `screens/MessagesScreen.tsx` — Proof Timeline

**Thread header changes (when conversation has a classroom_need):**
- Show item title, amount, teacher/school, current status
- Replace generic donation context with need context

**Structured proof blocks:**
Timeline events rendered as card-like blocks (distinct from chat bubbles):
- `FUNDED` — "Your funding is confirmed on-chain."
- `UNDER REVIEW` — "Glimpse is verifying the request and purchase details."
- `PURCHASED` — receipt/order artifact, optional order number
- `DELIVERED` — delivery confirmation
- `CLASSROOM PHOTO ADDED` — photo card + optional teacher note

**Implementation:** These are messages in the `messages` table with a `media_type = 'receipt'` or new type. Admin inserts structured proof messages manually (hackathon scope — no automated edge function). The UI renders proof blocks as card-like surfaces (distinct from normal chat bubbles) based on `media_type` or a JSON body prefix convention.

**Proof block vs chat bubble distinction (layout spec §7):**
- Proof updates (FUNDED, UNDER REVIEW, PURCHASED, etc.) → render as structured card blocks with status chip, timestamp, and optional attachment
- Human messages (donor note, admin replies) → render as normal chat bubbles

**Review copy rules (layout spec §9):**
- Use: "reviewing", "verifying", "processing"
- Avoid: "pending approval", "waiting", "manual fallback"
- Review should feel intentional and trustworthy, never bureaucratic

---

## Seed Data

After migration, insert listings at different states for the demo sequence (layout spec §11).

**Demo sequence requires:** browse OPEN need → fund it → see proof thread → show PURCHASED example → show DELIVERED example with classroom photo.

```sql
-- OPEN needs (fundable during demo)
INSERT INTO classroom_needs (title, description, image_url, price_usdc, teacher_first_name, school_name, school_city, school_state, source_url, source_asin, teacher_identity_key, status)
VALUES
  ('30 Composition Notebooks', 'Most of my students come in with one notebook for every subject. They end up tearing pages out and losing their work. I need 30 composition notebooks so each student has a dedicated one for writing.', NULL, 29.99, 'Sarah', 'Lincoln Elementary', 'Muscatine', 'IA', 'https://www.amazon.com/dp/B07CTBHPKB', 'B07CTBHPKB', 'intake-sarah-lincoln-001', 'open'),
  ('Classroom Set of 24 Scissors', 'Half of my scissors are broken or missing. We do art and science projects every week and students end up sharing one pair between four kids.', NULL, 18.49, 'Maria', 'Washington Middle School', 'Cedar Rapids', 'IA', 'https://www.amazon.com/dp/B00006IBKK', 'B00006IBKK', 'intake-maria-washington-001', 'open');

-- PURCHASED example (shows "in motion" state with proof)
INSERT INTO classroom_needs (title, description, image_url, price_usdc, teacher_first_name, school_name, school_city, school_state, source_url, source_asin, teacher_identity_key, status)
VALUES
  ('10-Pack Dry Erase Markers', 'I buy these with my own money every month. We use the whiteboard constantly for math and I go through markers fast with 28 students.', NULL, 12.99, 'James', 'Roosevelt Elementary', 'Des Moines', 'IA', 'https://www.amazon.com/dp/B00006JNM0', 'B00006JNM0', 'intake-james-roosevelt-001', 'purchased');

-- DELIVERED example (shows completed proof loop — must have a real conversation with proof messages)
INSERT INTO classroom_needs (title, description, image_url, price_usdc, teacher_first_name, school_name, school_city, school_state, source_url, source_asin, teacher_identity_key, status)
VALUES
  ('Classroom Headphone Set (30-Pack)', 'We have a computer lab rotation three times a week but only 8 working headphones. Most students can not hear their lessons. A class set would mean every student can participate.', NULL, 44.99, 'Lisa', 'Grant Elementary', 'Iowa City', 'IA', 'https://www.amazon.com/dp/B07V4MFB3Q', 'B07V4MFB3Q', 'intake-lisa-grant-001', 'delivered');

-- Admin data for seed needs (service_role insert)
INSERT INTO classroom_need_admin (classroom_need_id, shipping_address)
SELECT id, '{"name":"Lincoln Elementary","address1":"123 Main St","city":"Muscatine","state":"IA","zip":"52761"}'::jsonb
FROM classroom_needs WHERE teacher_identity_key = 'intake-sarah-lincoln-001';
-- (repeat for other seed needs as needed)
```

**Important (brief §14):** Demo seed data is allowed. Fabricating proof as real completed events is not. If purchased/delivered examples are seeded, label them internally and keep pitch language precise. The live demo should fund a real OPEN need on-chain.

---

## Build Order (Critical Path)

| Step | What | Est. Time | Files |
|------|------|-----------|-------|
| 1 | Migration 018 + deploy | 30min | `018_classroom_needs.sql` |
| 2 | Config + types | 20min | `donationConfig.ts`, `services/classroomNeeds.ts` |
| 3 | Transfer + donation plumbing | 30min | `transfer.ts`, `donations.ts`, `retry.ts` |
| 4 | record-donation changes | 1hr | `record-donation/index.ts` |
| 5 | helius-webhook changes | 20min | `helius-webhook/index.ts` |
| 6 | CampaignsScreen + NeedCard | 2hr | `CampaignsScreen.tsx`, `ui/NeedCard.tsx` |
| 7 | NeedDetailScreen | 1.5hr | `NeedDetailScreen.tsx`, `AppNavigator.tsx` |
| 8 | GiveScreen need mode | 1.5hr | `GiveScreen.tsx` |
| 9 | Messages proof timeline | 1hr | `MessagesScreen.tsx` |
| 10 | Seed data + E2E test | 30min | SQL + manual test |

**Total: ~7-8 hours**

**Deferred:** `trigger-purchase` edge function (Sp3nd auto-buy) — post-hackathon

---

## Sp3nd Agent Setup — DEFERRED (Post-Hackathon)

For hackathon, admin fulfills purchases manually via the Sp3nd consumer app.

Post-hackathon automation setup:
1. Generate agent wallet: `solana-keygen new --outfile agent-wallet.json`
2. Fund with USDC (~$100-200)
3. Register with Sp3nd: POST `/registerAgent`
4. Store secrets in Supabase: `SP3ND_API_KEY`, `SP3ND_API_SECRET`, `SP3ND_AGENT_PRIVATE_KEY`
5. Build `trigger-purchase` edge function (architecture in `docs/plans/2026-03-08-classroom-needs-design.md`)

---

## Codex Audit Checklist (Post-Build)

After Claude Code implements, Codex should verify:

1. Need mode truly feels distinct from general donation mode
2. Proof states read clearly at a glance
3. Feed remains premium/editorial, not retail
4. Motion stays quiet and performant (Seeker: Snapdragon 6 Gen 1)
5. Need locks atomically — no double-funding possible
6. No campaign dropdown exposed in need mode
7. No Amazon branding on primary surfaces
8. Status chip colors match the locked mapping
9. Copy follows Glimpse voice (fund/need/proof, never shop/buy/deal)
10. Teacher reply not promised as guaranteed anywhere
11. Single-column layout maintained
12. 44x44 minimum touch targets
13. CTA hierarchy obvious in light mode
