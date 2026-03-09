# Handoff: Hackathon Demo Deploy (2026-03-09)

## What Was Done

Merged `feat/classroom-needs` into `main` and deployed all backend changes so the full classroom needs demo is live for hackathon video recording. This is **not** a public app store release — the v1.1 app store build is preserved as a git tag.

## Actions Taken

### 1. Git: Tag v1.1 + Merge

- **Tagged** previous `main` HEAD (`9aa14dc1`) as `v1.1-appstore`
  - Restore anytime: `git checkout v1.1-appstore`
  - This is the build submitted to the Solana dApp Store on 2026-03-03
- **Merged** `feat/classroom-needs` → `main` via fast-forward (9 commits, clean history)
- Current `main` HEAD: `24aa30d7`

### 2. Database: Migration 018

- **Migration:** `018_classroom_needs.sql` — was already applied to remote (tables, RLS, indexes, functions all existed from a prior Codex session)
- **Repaired** migration history: marked 018 as `applied` so `supabase migration list` is in sync
- **Tables created:** `classroom_needs`, `classroom_need_admin`, `purchase_orders`
- **Column added:** `donations.classroom_need_id` (FK)
- **Functions created:** `get_classroom_needs_public()`, `get_classroom_need_by_id()`, `claim_classroom_need()`
- **RLS:** service_role-only on `classroom_needs` and `classroom_need_admin`, donor-reads-own on `purchase_orders`

### 3. Database: Seed Data (Migration 019)

- **Pushed** `019_seed_demo_threads.sql` as a temporary migration to get SQL into remote DB
- **Removed** the file from local repo after push (not committed — ephemeral deploy vehicle)
- **Note:** Migration 019 exists in remote history but not in local `supabase/migrations/`. This is intentional — it's seed data, not schema.
- **Wallet used:** `4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T` (presenter's Seeker wallet)

#### Seeded Data

| Table | Records | Details |
|-------|---------|---------|
| `classroom_needs` | 3 | Notebooks (open, $24.99), Markers (purchased, $31.50), Calculators (delivered, $42.00) |
| `donations` | 2 | Linked to markers + calculators needs, donor wallet = presenter |
| `conversations` | 2 | One per funded need |
| `messages` | 10 | Proof event timelines (funded → under review → purchased → delivered → classroom photo) |
| `purchase_orders` | 2 | Markers (ordered), Calculators (delivered) |

### 4. Edge Functions Deployed

| Function | Version | Deployed At | Changes |
|----------|---------|-------------|---------|
| `record-donation` | v25 | 2026-03-09 15:07:27 | Classroom need mode: UUID validation, `claim_classroom_need` RPC, exact price match, purchase order creation, need-specific welcome + proof event messages |
| `helius-webhook` | v6 | 2026-03-09 15:07:34 | `cn` memo field detection, classroom need claiming, purchase order creation, need-specific welcome + proof event messages |

Both deployed with `--no-verify-jwt` (unchanged from prior config).

## What Was NOT Done

- **No version bump** — `versionCode 2` / `versionName "1.1"` unchanged in `build.gradle`
- **No dApp Store submission** — this is hackathon-only
- **No git push** — `main` is merged locally but not pushed to `origin`
- **No APK build** — ready for the owner to build when ready

## Verification Checklist for Codex

### Code Review

- [ ] `record-donation/index.ts` — classroom need branch: UUID validation, memo `cn` cross-check, exact price match (±1 microUSDC), `claim_classroom_need` RPC call, purchase order upsert, need-specific welcome message + funded proof event
- [ ] `helius-webhook/index.ts` — `cn` memo detection, idempotent claim, purchase order upsert, need-specific welcome, conflict logging
- [ ] `config/donationConfig.ts` — `NeedStatus` type, `NEED_STATUS_LABELS`, `classroom-needs` intentionally excluded from `CAMPAIGN_OPTIONS` (routed via need-mode, not campaign dropdown)
- [ ] `services/classroomNeeds.ts` — calls `get_classroom_needs_public()` RPC, returns typed results
- [ ] `services/donations.ts` — `classroomNeedId` threaded through `executeDonation()`
- [ ] `utils/transfer.ts` — `cn` field added to memo JSON when `classroomNeedId` present
- [ ] `screens/NeedDetailScreen.tsx` — detail view with artwork, teacher info, fund button
- [ ] `screens/CampaignsScreen.tsx` — classroom needs feed via `NeedCard` components
- [ ] `screens/GiveScreen.tsx` — need-mode: locked amount, pinned summary, `classroomNeedId` param
- [ ] `screens/MessagesScreen.tsx` — proof timeline rendering, need thread inbox labels
- [ ] `navigation/AppNavigator.tsx` — `NeedDetail` route added to stack
- [ ] `ui/NeedCard.tsx`, `ui/NeedArtwork.tsx`, `ui/AppHeader.tsx` — new/modified UI components
- [ ] `supabase/migrations/018_classroom_needs.sql` — schema, RLS, indexes, security-definer functions, atomic claim function

### Data Integrity

- [ ] 3 classroom needs exist with correct statuses (open, purchased, classroom_photo_added)
- [ ] 2 demo donations linked to needs with presenter wallet
- [ ] 2 conversations with proof event message timelines
- [ ] 2 purchase orders (ordered, delivered)
- [ ] Open need (notebooks) has NO donation/conversation (available for live demo funding)

### Deployment State

- [ ] `supabase migration list` shows 018 applied, 019 applied (019 is seed-only, no local file)
- [ ] `record-donation` v25 active
- [ ] `helius-webhook` v6 active
- [ ] `v1.1-appstore` git tag exists and points to `9aa14dc1`

### Risk Items

1. **Migration 019 mismatch** — Remote has migration 019 (seed data) but local does not. Future `supabase db push` will not error (push only applies local migrations not yet in remote), but `supabase migration list` will show a remote-only entry. This is cosmetic. To clean up later: `supabase migration repair 019 --status reverted --linked`.
2. **Seed data uses fake tx signatures** — `DEMO-TX-PURCHASED-*` and `DEMO-TX-COMPLETED-*` are not real on-chain transactions. On-chain verification features (Helius Enhanced API badge) will show these as unverified. Acceptable for demo.
3. **Edge functions are live on production** — The classroom needs code paths only activate when `classroomNeedId` is present in the request body or `cn` in the memo. Standard donation flow is unaffected. No regression risk to existing mainnet donations.

## Files Changed (vs v1.1-appstore tag)

```
config/donationConfig.ts
navigation/AppNavigator.tsx
screens/CampaignsScreen.tsx
screens/GiveScreen.tsx
screens/MessagesScreen.tsx
screens/NeedDetailScreen.tsx          (new)
services/chat.ts
services/classroomNeeds.ts            (new)
services/donations.ts
supabase/functions/helius-webhook/index.ts
supabase/functions/record-donation/index.ts
supabase/migrations/018_classroom_needs.sql  (new)
supabase/seed/classroom_needs_demo.sql       (new)
supabase/seed/classroom_needs_demo_threads.sql (new)
ui/AppHeader.tsx
ui/NeedArtwork.tsx                    (new)
ui/NeedCard.tsx                       (new)
utils/retry.ts
utils/transfer.ts
+ 12 docs/plans/ and docs/handoffs/ files
```
