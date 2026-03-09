# Classroom Needs — Milestone 3 Handoff

**Date:** 2026-03-09
**Milestone:** Proof Timeline, Admin Flow Surfaces, Demo Polish
**Status:** Complete — ready for Codex review

---

## Files Changed

| File | Change |
|------|--------|
| `services/chat.ts` | Added `ProofEventBody`, `ProofEventKind` types, `parseProofEvent()` helper. Added `classroom_need_id` to `Conversation` interface and `fetchConversations()` join. |
| `screens/MessagesScreen.tsx` | New `ProofEventBubble` component renders proof events with accent bar, status badge, detail text, media, and receipt tag. Chat `renderItem` detects proof events via `parseProofEvent()` and routes to `ProofEventBubble`. Thread header fetches classroom need and shows teacher/school/status context. Conversation list shows "CLASSROOM NEED" label for need threads. |
| `supabase/seed/classroom_needs_demo.sql` | **NEW** — 3 demo needs: open (notebooks), purchased (markers), classroom_photo_added (calculators). |

---

## Proof Rendering Contract (Final)

### Detection

```ts
const proof = parseProofEvent(message.body);
if (proof) {
  // Render ProofEventBubble
} else {
  // Render normal MessageBubble
}
```

`parseProofEvent()` returns `ProofEventBody | null`. It tries `JSON.parse(body)` and checks `kind === 'proof_event'`.

### Visual Treatment

Proof events render as **full-width timeline cards** (not chat bubbles):
- **4px accent bar** on left edge, color-coded by event type
- **Status badge** (pill) with label text in event color
- **Timestamp** right-aligned in top row
- **Detail text** below badge (optional)
- **Media image** if `media_url` is present (receipt photos, delivery photos)
- **RECEIPT tag** if `media_type === 'receipt'`

### Color Coding

| Event | Color |
|-------|-------|
| `funded` | success (#2A9274) |
| `under_review` | accent (#6554D1) |
| `purchased` | accent (#6554D1) |
| `delivered` | teal (#47CBCD) |
| `classroom_photo_added` | teal (#47CBCD) |
| `failed` | danger (#A83D62) |

### Proof Event Body Shape (unchanged from M1)

```ts
{
  kind: 'proof_event',
  event: 'funded' | 'under_review' | 'purchased' | 'delivered' | 'classroom_photo_added' | 'failed',
  label: string,
  detail?: string,
  meta?: Record<string, string | number | boolean | null>
}
```

- Stored as `body = JSON.stringify(ProofEventBody)`, `media_type = null` (or `'receipt'` with attachment)
- Normal messages remain plain text

---

## Thread Header Context

For classroom need threads (`conversation.classroom_need_id` is set):

- **Title**: Need title (e.g., "30-Pack Composition Notebooks") instead of generic recipient label
- **Subtitle**: Teacher and school info (e.g., "Ms. Rivera's class at Lincoln Elementary • FUNDED")
- **Need status** shown via `NEED_STATUS_LABELS`

For general donation threads: unchanged behavior.

### Conversation List

Need threads display "CLASSROOM NEED" instead of "GLIMPSE #001" for the row title.

---

## Demo Seed States

| Need | Status | Title | Teacher | School |
|------|--------|-------|---------|--------|
| `a1b2c3d4-...` | `open` | 30-Pack Composition Notebooks | Ms. Rivera | Lincoln Elementary, Muscatine IA |
| `b2c3d4e5-...` | `purchased` | Classroom Set of Markers (12 boxes) | Mr. Thompson | Washington Middle School, Davenport IA |
| `c3d4e5f6-...` | `classroom_photo_added` | Scientific Calculator Set (10-pack) | Ms. Chen | Jefferson Academy, Iowa City IA |

Seed file: `supabase/seed/classroom_needs_demo.sql`

To populate demo proof events in message threads (after a need is funded):
```sql
-- Insert proof events into an existing conversation
INSERT INTO messages (conversation_id, sender_wallet, body) VALUES
  ('<conv_id>', '<admin_wallet>', '{"kind":"proof_event","event":"funded","label":"FUNDED","detail":"Your funding is confirmed on-chain."}'),
  ('<conv_id>', '<admin_wallet>', '{"kind":"proof_event","event":"under_review","label":"UNDER REVIEW","detail":"Glimpse is reviewing this request before purchase."}'),
  ('<conv_id>', '<admin_wallet>', '{"kind":"proof_event","event":"purchased","label":"PURCHASED","detail":"Item purchased and shipping to the school."}'),
  ('<conv_id>', '<admin_wallet>', '{"kind":"proof_event","event":"delivered","label":"DELIVERED","detail":"The item has arrived at the classroom."}');
```

---

## Codex Review Fixes (Post-M3)

### [P1] Proof events spoofable by any participant

`parseProofEvent()` parsed any message body as a proof card regardless of sender. A donor could type JSON and fake a DELIVERED card. Fixed: the `renderItem` in `MessagesScreen.tsx` now only calls `parseProofEvent()` for messages where `isSenderAdmin()` is true. Donor-sent JSON renders as a plain text bubble.

### [P2] Need threads indistinguishable in inbox

All classroom need conversations showed the constant string "CLASSROOM NEED" with no item context. Fixed: added `needTitles` state map populated by fetching each unique `classroom_need_id` via `fetchClassroomNeedById()`. Conversation rows now show the need title (e.g., "30-Pack Composition Notebooks") below the "CLASSROOM NEED" label.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Clean (0 errors) |
| `npx jest --watchAll=false` | 70/70 tests pass |
| Bundle check | Compiles successfully |

---

## Motion / Interaction Notes

- **ProofEventBubble** enters with a 220ms fade+slide-up animation (slightly slower than chat bubbles for visual emphasis)
- **Accent bar** is 4px wide, full height of the card — creates a timeline rail effect when multiple proof events appear in sequence
- **No horizontal slide** — proof events are full-width and center-aligned, unlike chat bubbles which slide left/right

---

## Known Issues / Deferred Items

1. **Seed SQL needs deployed migration** — `classroom_needs_demo.sql` requires migration 018 to be deployed first via `supabase db push`.
2. **No image URLs in seed data** — Demo needs have `image_url = NULL`. Real images can be added after seed or via admin tooling.
3. **Admin proof insertion is manual SQL** — No admin UI for inserting proof events. For the demo, proof events are pre-seeded or inserted via SQL/Supabase dashboard.
4. **Classroom need fetch in thread header** — One additional RPC call per thread open for need threads. Non-blocking (header shows "Classroom Need" until data arrives). Could be optimized with a join on the conversation fetch.
5. **Proof event media** — The `ProofEventBubble` handles `media_url` resolution via signed URLs, same as `MessageBubble`. Media attachment requires admin to upload to `chat-media` bucket and reference the storage path.
6. **No proof timeline summary** — Proof events render inline in the chat. A dedicated timeline view (collapsed summary) could be added post-hackathon.
