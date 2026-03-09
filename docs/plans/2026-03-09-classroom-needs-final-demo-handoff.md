# Classroom Needs — Final Demo Handoff

**Date:** 2026-03-09
**Status:** Complete — ready for presenter walkthrough
**Purpose:** Everything needed to run the hackathon demo with seeded data

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/seed/classroom_needs_demo.sql` | 3 classroom needs (open, purchased, classroom_photo_added) — unchanged from M3 |
| `supabase/seed/classroom_needs_demo_threads.sql` | **NEW** — Full demo threads: 2 donations, 2 conversations, 10 proof messages, 2 purchase orders |

---

## SQL Files To Run

| Order | File | What it does |
|-------|------|-------------|
| 1 | `supabase/migrations/018_classroom_needs.sql` | Creates `classroom_needs`, `classroom_need_admin`, `purchase_orders` tables + RLS + RPC functions |
| 2 | `supabase/seed/classroom_needs_demo.sql` | Seeds 3 classroom needs in different states |
| 3 | `supabase/seed/classroom_needs_demo_threads.sql` | Seeds donations, conversations, proof messages, purchase orders for 2 of the 3 needs |

---

## Exact Run Order

### Step 1 — Deploy migration (if not already deployed)

```bash
supabase db push
```

Or paste `supabase/migrations/018_classroom_needs.sql` into the Supabase SQL Editor.

### Step 2 — Run the classroom needs seed

Open the Supabase SQL Editor at:
`https://supabase.com/dashboard/project/knvagydrbbvuumabmxcg/sql`

Paste the contents of `supabase/seed/classroom_needs_demo.sql` and run.

### Step 3 — Prepare the threads seed

Open `supabase/seed/classroom_needs_demo_threads.sql`.

**Find and replace** `DEMO_DONOR_WALLET` with the presenter's actual Solana wallet address.

There are **6 occurrences** to replace:
- 2 in `donations.donor_wallet`
- 2 in `classroom_needs.funded_by_wallet`
- 2 in `conversations.donor_wallet`

**Terminal shortcut:**
```bash
sed 's/DEMO_DONOR_WALLET/YourWalletBase58Here/g' \
  supabase/seed/classroom_needs_demo_threads.sql | pbcopy
```
Then paste into SQL Editor.

### Step 4 — Run the threads seed

Paste the modified SQL into the Supabase SQL Editor and run.

### Step 5 — Verify

Run this verification query in the SQL Editor:

```sql
SELECT cn.title, cn.status, d.amount_usdc, c.id AS conv_id,
       (SELECT count(*) FROM messages m WHERE m.conversation_id = c.id) AS msg_count
FROM classroom_needs cn
LEFT JOIN donations d ON d.classroom_need_id = cn.id
LEFT JOIN conversations c ON c.donation_id = d.id
ORDER BY cn.created_at;
```

**Expected result:**

| title | status | amount_usdc | conv_id | msg_count |
|-------|--------|-------------|---------|-----------|
| 30-Pack Composition Notebooks | open | NULL | NULL | NULL |
| Classroom Set of Markers (12 boxes) | purchased | 31.50 | e1000001-... | 4 |
| Scientific Calculator Set (10-pack) | classroom_photo_added | 42.00 | e1000001-... | 6 |

### Step 6 — Open app and verify

Connect the presenter wallet in the app. Confirm:

1. **NEEDS tab** — shows all 3 needs in grouped sections (Open, In Motion, Delivered)
2. **Messages tab** — shows 2 conversation threads labeled "CLASSROOM NEED" with need titles
3. **Markers thread** — opens with welcome + 3 proof cards (FUNDED → UNDER REVIEW → PURCHASED)
4. **Calculators thread** — opens with welcome + 5 proof cards (FUNDED → UNDER REVIEW → PURCHASED → DELIVERED → CLASSROOM PHOTO)

---

## Required Presenter Wallet Substitution Points

The string `DEMO_DONOR_WALLET` appears in `classroom_needs_demo_threads.sql` in these columns:

1. `donations.donor_wallet` (2 rows)
2. `classroom_needs.funded_by_wallet` via UPDATE (2 rows)
3. `conversations.donor_wallet` (2 rows)

All must be the same wallet — the one the presenter connects during the demo.

---

## What Was Validated

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Clean (0 errors) |
| `npx jest --watchAll=false` | 70/70 tests pass |
| Bundle compiles | Yes |
| Seed SQL syntax verified | Valid PostgreSQL |
| Deterministic UUIDs cross-referenced | All FKs resolve |
| Admin wallet matches `config/env.ts` | `DdqT7Fek...` |
| Proof event JSON matches `parseProofEvent()` contract | `kind: 'proof_event'`, `event`, `label`, `detail` |
| Messages sent from admin wallet | Proof cards render (admin-gated) |
| Conversation `donor_wallet` set to presenter | Threads visible in inbox |
| All inserts use deterministic IDs | Messages won't duplicate on re-run |
| Wallet-bearing rows use `ON CONFLICT DO UPDATE` | Correcting wallet and re-running repairs all rows |

---

## 30-Second Demo Script

> "Glimpse connects donors directly to classroom needs."
>
> *[Show NEEDS tab]* "Teachers submit exactly what they need — notebooks, markers, calculators. A donor picks one, funds it with USDC, and Glimpse handles the rest."
>
> *[Tap into calculator thread]* "Every step is tracked in-app: funded, reviewed, purchased, delivered — and the teacher confirmed it reached the classroom. The donor sees proof that their money became a real thing in a real classroom."
>
> "That's Glimpse. Give. See the proof. Start a conversation."

---

## 2-Minute Demo Script

> "Three out of four donors never give again. Not because they stopped caring — because nobody showed them what happened. Glimpse fixes that."
>
> *[Show NEEDS tab — open section]*
> "Teachers submit exactly what their classroom needs. Ms. Rivera needs composition notebooks for daily journaling — $24.99. A donor can see the teacher, the school, the exact price. No middleman markup."
>
> *[Show NEEDS tab — delivered section]*
> "Once funded, Glimpse reviews the need, purchases the item, and ships it to the school. Every step is tracked."
>
> *[Tap into calculators thread]*
> "Here's a completed need. The donor funded $42 in USDC for calculators. Watch the timeline: FUNDED — confirmed on-chain. UNDER REVIEW — Glimpse verified the need. PURCHASED — order placed. DELIVERED — arrived at the school. And then — CLASSROOM PHOTO — Ms. Chen confirmed her students are using the calculators during pre-algebra. The loop is closed."
>
> *[Pause]* "That's the giving loop. The donor sees proof. The teacher sees support. And that connection — that's what brings donors back."
>
> *[Tap into markers thread]*
> "Here's one still in motion. Mr. Thompson's markers are purchased and shipping. The donor can follow along in real time."
>
> *[Back to NEEDS tab]*
> "Every dollar tracked. Every impact proven. Zero fees to donors. That's Glimpse."

---

## Fallback Plan

### Problem: Inbox shows no threads

**Cause:** Wrong wallet connected. Seeded conversations are scoped to `DEMO_DONOR_WALLET`.

**Fix:** Disconnect and reconnect with the correct presenter wallet. If uncertain which wallet was used in the seed, run in SQL Editor:

```sql
SELECT donor_wallet FROM conversations
WHERE id IN ('e1000001-0001-4000-b000-000000000001', 'e1000001-0001-4000-b000-000000000002');
```

### Problem: Seeded with wrong wallet, need to correct

**Cause:** `DEMO_DONOR_WALLET` was replaced with the wrong address on the first run.

**Fix:** The seed is designed for this. Update the wallet placeholder to the correct address and re-run the entire `classroom_needs_demo_threads.sql`. Donations and conversations use `ON CONFLICT (id) DO UPDATE SET donor_wallet = EXCLUDED.donor_wallet`, so the wallet columns will be corrected in place. Messages and purchase orders are unaffected (no wallet dependency). The `UPDATE classroom_needs` statements are unconditional and will also correct.

### Problem: NEEDS tab is empty

**Cause:** Migration 018 not deployed, or seed SQL not run.

**Fix:** Check if the table exists:

```sql
SELECT count(*) FROM classroom_needs;
```

If table doesn't exist → deploy migration 018 first.
If table exists but empty → run `classroom_needs_demo.sql`.

### Problem: Threads show but no proof cards

**Cause:** `classroom_needs_demo_threads.sql` not run, or messages table empty for these conversations.

**Fix:** Check message count:

```sql
SELECT conversation_id, count(*) FROM messages
WHERE conversation_id IN ('e1000001-0001-4000-b000-000000000001', 'e1000001-0001-4000-b000-000000000002')
GROUP BY conversation_id;
```

Expected: 4 messages for purchased thread, 6 for completed thread.
If 0 → re-run `classroom_needs_demo_threads.sql`.

### Problem: Proof cards render as plain text (JSON visible)

**Cause:** Messages were inserted with wrong `sender_wallet`. Proof events only render as timeline cards when sent from admin wallet.

**Fix:** Verify sender:

```sql
SELECT sender_wallet FROM messages
WHERE conversation_id = 'e1000001-0001-4000-b000-000000000001' LIMIT 1;
```

Must be `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk`. If not, the seed file was modified incorrectly. Re-run from the original.

### Problem: One thread loads but the other doesn't

**Cause:** Partial seed application (SQL Editor stopped mid-execution).

**Fix:** All rows use deterministic IDs with `ON CONFLICT` handling. Safe to re-run the entire file — messages won't duplicate, and wallet-bearing rows will update in place.

### Problem: Generic donation flow broken

**Cause:** Shouldn't happen — seeded data is additive. But if it does:

**Fix:** Verify the Give tab with `mode: 'general'` (tap Give in tab bar). The need-mode guard (`!needMode && !selectedCampaign`) means general flow is independent of seeded data.

---

## Seeded Record Summary

| Table | Records | IDs |
|-------|---------|-----|
| `classroom_needs` | 3 | `a1b2c3d4-...` (open), `b2c3d4e5-...` (purchased), `c3d4e5f6-...` (completed) |
| `donations` | 2 | `d1000001-...-0001` (markers), `d1000001-...-0002` (calculators) |
| `conversations` | 2 | `e1000001-...-0001` (markers), `e1000001-...-0002` (calculators) |
| `messages` | 10 | 4 in markers thread, 6 in calculators thread |
| `purchase_orders` | 2 | `f1000001-...-0001` (ordered), `f1000001-...-0002` (delivered) |
