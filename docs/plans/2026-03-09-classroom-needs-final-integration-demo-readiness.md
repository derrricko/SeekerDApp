# Classroom Needs — Final Integration + Demo Readiness

**Date:** 2026-03-09
**Status:** Final execution handoff for Claude
**Purpose:** make the hackathon demo reliable and legible without requiring live funding

---

## 1. North Star

This phase is not about proving mainnet readiness.

This phase is about making the product concept instantly understandable to hackathon judges:

> **A donor can browse a real classroom need, fund the exact item, and later see proof that it was purchased and reached the classroom.**

Everything in this phase should optimize for that story.

If a choice makes the demo more stable and makes that story clearer, it is the right choice.

If a choice tries to preserve live-payment realism but adds demo risk, it is the wrong choice.

---

## 2. Hard Constraint

Use **seeded demo data only**.

Do **not** spend time on:

1. devnet conversion
2. live mainnet funding for the demo
3. adding USDC to a presenter wallet
4. creating fake on-chain transactions just for optics
5. changing the architecture to support a temporary fake payment rail

The app is currently mainnet-assumed across client and edge functions. Rewiring that tonight is unnecessary risk.

---

## 3. Demo Strategy

The demo should show three truths:

1. `OPEN` need: what a donor can fund
2. `PURCHASED` need: proof that Glimpse completed the purchase step
3. `CLASSROOM PHOTO ADDED` need: proof that the item reached the classroom and the loop closed

This is enough to communicate the product.

Live funding is optional. It is **not required** for the story to land.

---

## 4. What Claude Should Deliver

Claude should complete this phase by producing:

1. a final seeded demo SQL path that creates all required app-visible records
2. a final run order for migrations + seeds
3. a manual validation checklist
4. a 30-second and 2-minute demo script
5. a fallback plan if any one surface fails during the demo
6. a final handoff doc back to Codex

---

## 5. Required Demo Data

The current `supabase/seed/classroom_needs_demo.sql` is not enough by itself.

It seeds `classroom_needs`, but the app also needs seeded records for:

1. `donations`
2. `conversations`
3. `messages`
4. `purchase_orders`

Without those, the proof timeline and inbox cannot fully demo.

### Required seeded states

#### State A — Open Need

Purpose:
- show `NEEDS` browse surface
- show detail page
- show exact amount and teacher context

Records required:
- `classroom_needs` row only

#### State B — Purchased Need With Proof Thread

Purpose:
- show funded -> under review -> purchased proof path
- show proof events in Messages
- show thread header context

Records required:
- `classroom_needs` row with `status = 'purchased'`
- `donations` row linked by `classroom_need_id`
- `purchase_orders` row linked to the donation
- `conversations` row linked to the donation
- `messages` rows including:
  - welcome text
  - `funded` proof event
  - `under_review` proof event
  - `purchased` proof event
  - optional receipt proof event

#### State C — Classroom Photo Added Need With Proof Thread

Purpose:
- show the completed emotional loop
- show delivered/classroom-photo proof state

Records required:
- `classroom_needs` row with `status = 'classroom_photo_added'`
- `donations` row linked by `classroom_need_id`
- `purchase_orders` row linked to the donation
- `conversations` row linked to the donation
- `messages` rows including:
  - welcome text
  - `funded`
  - `under_review`
  - `purchased`
  - `delivered`
  - `classroom_photo_added`

---

## 6. Wallet Reality

Messages and conversation access are still wallet-scoped.

That means seeded conversation rows must use the **presenter wallet** as `donor_wallet`, or the presenter will not be able to open the seeded proof threads in-app.

Claude should make this explicit in the final seed setup.

### Required approach

Use a clearly marked placeholder in the SQL such as:

```sql
-- Replace before running
-- DEMO_DONOR_WALLET = '<presenter wallet>'
```

Then apply that wallet consistently to:

1. `donations.donor_wallet`
2. `conversations.donor_wallet`

Admin-authored proof messages should continue using the configured admin wallet.

---

## 7. Exact Claude Tasks

### Task 1 — Create Full Demo Seed Path

Claude should either:

1. extend `supabase/seed/classroom_needs_demo.sql`, or
2. create a second seed file such as `supabase/seed/classroom_needs_demo_threads.sql`

The result must seed:

1. 3 classroom needs
2. 2 seeded donations linked to needs
3. 2 seeded conversations
4. proof-event message sequences for the purchased and completed threads
5. purchase orders for those seeded donations

Use deterministic UUIDs where helpful.

Use obviously demo-safe tx signatures, but ensure they satisfy the app’s display assumptions.

### Task 2 — Ensure App Surfaces Work Against Seeded Data

Claude should manually verify:

1. `NEEDS` feed shows the 3 seeded states
2. open need detail screen loads correctly
3. inbox shows classroom-need rows distinctly
4. purchased thread opens and shows proof cards
5. classroom-photo-added thread opens and shows the completed proof path
6. generic donation flow is not broken by seeded data

### Task 3 — Provide Exact Run Order

Claude should give the exact order to prepare the demo environment:

1. deploy migrations
2. run need seed file
3. run thread/proof seed file
4. confirm presenter wallet used in seeded donor rows
5. open app and verify seeded states

No vague instructions. This must be copy-pasteable.

### Task 4 — Demo Script

Claude should write:

1. a 30-second script
2. a 2-minute script

The script should avoid talking about devnet or hacky demo constraints.

It should say:

1. teachers submit needs
2. donors fund exact items
3. Glimpse reviews and purchases
4. proof is tracked in-app
5. classroom updates deepen the giving loop

### Task 5 — Failure Contingencies

Claude should include backup paths for:

1. seeded inbox not showing because the wrong wallet is connected
2. migrations not deployed yet
3. seed SQL partially applied
4. one thread failing to load

Each contingency should say exactly how to recover during the demo.

---

## 8. Explicit Non-Goals

Claude should not spend time on:

1. devnet support
2. mock wallet transactions
3. live on-chain funding rehearsal
4. Sp3nd automation
5. admin UI for proof insertion
6. broad product polish outside demo-critical correctness

---

## 9. Final Review Gate

Before handing this back to Codex, Claude should be able to say:

1. the demo can be run without sending real funds
2. the presenter can open the seeded proof threads on their actual wallet
3. the app clearly shows `open`, `purchased`, and `classroom photo added`
4. the proof timeline is visible and legible
5. the demo script matches what the app actually shows

If any one of those is not true, this phase is not done.

---

## 10. Final Handoff Doc Required

Claude should return one final handoff doc, for example:

`docs/plans/2026-03-09-classroom-needs-final-demo-handoff.md`

It must include:

1. files changed
2. exact SQL files to run
3. exact order to run them
4. required presenter wallet substitution points
5. what was manually validated
6. 30-second demo script
7. 2-minute demo script
8. fallback plan if seeded proof threads do not appear

---

## 11. Final Reminder

The judges do not need to watch real money move.

They need to understand, quickly and viscerally, that Glimpse can become the place where teachers ask for exactly what they need and donors can see proof that it reached the classroom.

That is the product.
