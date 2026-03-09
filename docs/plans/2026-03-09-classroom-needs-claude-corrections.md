# Classroom Needs — Claude Corrections

**Date:** 2026-03-09
**Purpose:** Correct the build handoff before implementation begins
**Applies to:** `docs/plans/2026-03-09-classroom-needs-build-handoff.md`

---

## Critical Corrections

These are not optional refinements. They prevent data leaks, broken need matching, and false double-funding failures.

---

## 1. Do Not Expose Admin-Only Fields On `classroom_needs`

### Problem

The current handoff puts these fields directly on `public.classroom_needs`:

- `shipping_address`
- `admin_review_notes`
- `fulfillment_notes`
- `proof_review_state`

It then grants public `SELECT` on the table and relies on the client to never select those columns.

That is not safe.

### Why It Fails

- any client query can still request those columns
- Realtime can expose the same row shape
- row-level security does not hide individual columns

### Required Fix

Split sensitive fields into a separate admin-only table.

Recommended structure:

```sql
CREATE TABLE public.classroom_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_usdc NUMERIC(10,2) NOT NULL CHECK (price_usdc > 0),
  teacher_first_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_city TEXT,
  school_state TEXT,
  source_url TEXT,
  source_asin TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','funded','under_review','purchased','delivered','classroom_photo_added','failed')),
  funded_by_wallet TEXT,
  funded_by_donation_id UUID REFERENCES public.donations(id),
  donor_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.classroom_need_admin (
  classroom_need_id UUID PRIMARY KEY REFERENCES public.classroom_needs(id) ON DELETE CASCADE,
  shipping_address JSONB NOT NULL,
  admin_review_notes TEXT,
  fulfillment_notes TEXT,
  proof_review_state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Policy Direction

- `classroom_needs`: public read
- `classroom_need_admin`: service-role only

Do not store private operational data on the publicly readable row.

---

## 2. `cn` Memo Field Must Identify The Need Exactly

### Problem

The current handoff says:

- store `cn` as the first 8 chars of the UUID
- later use `cn` to look up and lock the classroom need

That will not work against a UUID primary key.

### Why It Fails

- `classroom_needs.id` is a UUID
- first 8 chars are not unique enough for safe production lookup
- `WHERE id = cn` will fail or force unsafe fuzzy matching

### Required Fix

Pick one of these and use it consistently everywhere:

1. **Preferred:** store the full UUID in `cn`
2. **Alternative:** add a stable short public code column like `public_code TEXT UNIQUE`

### Recommendation

Use the full UUID in the memo unless memo size becomes a proven issue. It should still fit comfortably inside the existing memo budget.

Do not truncate the identity key.

---

## 3. Need Locking Must Be Idempotent Across Client + Webhook Recording

### Problem

The app already has dual recording:

- client path via `record-donation`
- webhook fallback via `helius-webhook`

The current handoff says:

- update the need from `open` to `funded`
- if 0 rows affected, return `409 Conflict`

That is not enough.

### Why It Fails

The same valid donation can be observed by both recording paths. If one path claims the need first, the other path may see 0 rows updated and incorrectly treat the same donation as a second donor conflict.

### Required Fix

The funding claim path must be:

- atomic
- idempotent
- aware of the existing donation or transaction signature

### Correct Behavior

For a given `classroomNeedId`:

1. fetch the need
2. if already funded by the same donation or same tx signature path, treat as success
3. if still open, atomically claim it
4. if funded by a different donation, treat as actual conflict

### Recommendation

Implement the claim in a transaction or RPC function that can:

- inspect current state
- compare existing `funded_by_donation_id`
- avoid false conflicts on replay

Do not bolt this on as a blind `UPDATE ... WHERE status = 'open'`.

---

## 4. Exact Need Funding Means Exact Amount Match

### Problem

The current handoff validates:

`amountUSDC >= need.price_usdc`

That violates the product promise.

### Why It Fails

The product is:

- one donor
- one exact need
- one exact price

Allowing overpayment creates undefined behavior:

- what happens to extra USDC
- whether the donor actually funded the listed amount
- whether the need is still “exact”

### Required Fix

Enforce exact amount equality to the stored need price.

If a small tolerance is needed, make it:

- explicit
- tiny
- only for raw-unit precision handling

But the business rule remains exact-price funding.

---

## 5. Teacher Uniqueness Needs A Stable Identity

### Problem

The handoff enforces one open request per teacher using:

`(teacher_first_name, school_name) WHERE status = 'open'`

### Why It Fails

- two teachers can share a first name at one school
- formatting differences can evade the rule
- it is not a stable teacher identity

### Required Fix

Use a stable submission identity from the teacher intake flow.

Options:

- teacher email hash
- external form submission id
- teacher intake id

### Recommendation

Add a non-public `teacher_submission_key` or `teacher_identity_key` and enforce uniqueness on that for open requests.

Do not use first name as identity.

---

## 6. Keep The Rest Of The Direction

These parts of the build handoff are correct and should stay:

- `NEEDS` as default first view
- single-column editorial feed
- full-screen Need Detail
- Give screen need mode
- manual admin review between funded and purchased
- proof timeline in Messages
- no dropdown-based donor UX
- Sp3nd automation deferred post-hackathon

---

## 7. Required Changes To The Build Handoff

Before implementation starts, update the build handoff to reflect:

1. `classroom_need_admin` split for private fields
2. full UUID or stable public code for `cn`
3. idempotent atomic claim logic
4. exact amount match
5. stable teacher identity key

If these five items are not corrected, implementation should pause before migration and edge function work.
