# Classroom Needs — Milestone 1 Handoff

**Date:** 2026-03-09
**Milestone:** Data Model, Services, Edge Functions
**Status:** Complete — ready for Codex review

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/018_classroom_needs.sql` | **NEW** — 3 tables, RLS, indexes, realtime, claim function |
| `config/donationConfig.ts` | Added `NeedStatus` type, `NEED_STATUS_LABELS`, `classroom-needs` campaign |
| `services/classroomNeeds.ts` | **NEW** — `ClassroomNeed` interface, `fetchClassroomNeeds()`, `fetchClassroomNeedById()`, `groupNeedsBySection()` |
| `utils/transfer.ts` | Added `classroomNeedId` param to `buildDonationTransaction()`, `cn` field in memo |
| `utils/retry.ts` | Added `classroomNeedId` to `PendingConversation` interface |
| `services/donations.ts` | Threaded `classroomNeedId` through `executeDonationSeamless` → `confirmAndRecord` → `recordAndCreateConversationSecure` → POST body. Added to `DonationResult`. |
| `supabase/functions/record-donation/index.ts` | Classroom need branch: UUID validation, exact amount match, `claim_classroom_need()` RPC, `purchase_orders` insert, need-specific welcome message + funded proof event |
| `supabase/functions/helius-webhook/index.ts` | Detects `cn` in memo, sets `classroom_need_id` on donation, calls `claim_classroom_need()`, need-specific welcome + proof event |

---

## Locked Contracts (Final)

### `NeedStatus`

```ts
export type NeedStatus =
  | 'open'
  | 'funded'
  | 'under_review'
  | 'purchased'
  | 'delivered'
  | 'classroom_photo_added'
  | 'failed';
```

### `ClassroomNeed` (public-facing — donor-visible columns only)

```ts
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
  created_at: string;
  updated_at: string;
}
```

Private fields excluded from public interface: `teacher_identity_key`, `funded_by_wallet`, `funded_by_donation_id`, `donor_note`, `source_url`, `source_asin`. These remain on the base table (service_role access only) but are never returned by the security-definer RPC functions.

### `executeDonationSeamless` Signature

```ts
export async function executeDonationSeamless(
  connection: Connection,
  recipientWallet: string,
  recipientId: string,
  amountUSDC: number,
  cadence: DonationCadence,
  authorizeSignAndBuild: (
    buildTransaction: (donorPubkey: PublicKey) => Promise<Transaction>,
  ) => Promise<WalletSignResult>,
  causePreferences?: string[],
  donationMode?: DonationMode,
  classroomNeedId?: string,       // NEW — full UUID
): Promise<Result<DonationResult>>
```

### `DonationResult`

```ts
export interface DonationResult {
  txSignature: string;
  memo: DonationMemo;
  conversationId: string | null;
  donorWallet: string;
  recordError: string | null;
  classroomNeedId?: string | null;  // NEW
}
```

### `DonationMemo` (on-chain)

```ts
export interface DonationMemo {
  d: string;      // donor wallet (first 8)
  r: string;      // recipient wallet (first 8)
  a: number;      // amount USDC
  t: number;      // unix timestamp
  app: string;    // "glimpse"
  tok: string;    // "usdc"
  c?: string;     // cadence
  cn?: string;    // classroom need ID (full UUID) — NEW
}
```

### Proof Event Contract

```ts
type ProofEventBody = {
  kind: 'proof_event';
  event: 'funded' | 'under_review' | 'purchased' | 'delivered' | 'classroom_photo_added' | 'failed';
  label: string;
  detail?: string;
  meta?: Record<string, string | number | boolean | null>;
};
```

- Proof events: `body = JSON.stringify(ProofEventBody)`, `media_type = null`
- Receipt proof: same JSON body + `media_type = 'receipt'` + `media_url` if attachment exists
- Normal messages: plain text body
- UI detection: parse body, check `kind === 'proof_event'`

### Give Route Params (for Milestone 2)

```ts
type GiveNeedParams = {
  mode: 'need';
  classroomNeedId: string;
  title: string;
  imageUrl?: string | null;
  teacherFirstName: string;
  schoolName: string;
  schoolCity?: string | null;
  schoolState?: string | null;
  amountUSDC: number;
  status: NeedStatus;
};
```

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Clean (0 errors) |
| `npx jest --watchAll=false` | 70/70 tests pass |
| Bundle check | Compiles successfully |
| Migration SQL | Syntactically valid, ready for `supabase db push` |

---

## Claim Behavior Summary

| Scenario | Result |
|----------|--------|
| Open need + valid donation | `'claimed'` — need locked to funded |
| Same donation replayed (dual recording) | `'already_claimed_same'` — treated as success |
| Different donation on funded need | `'conflict'` — 409 from record-donation, warning log from webhook |
| Amount mismatch (not exact) | 422 validation error before claim attempt |
| Invalid need UUID | 400 format error or 404 not found |

---

## Codex Review Fixes (Post-M1)

All four findings from Codex review have been resolved:

### [P0] Public rows no longer leak private fields

- Removed `FOR SELECT USING (true)` policy from `classroom_needs` base table
- Added `get_classroom_needs_public()` and `get_classroom_need_by_id()` security-definer functions that return only donor-visible columns
- `ClassroomNeed` interface now excludes: `teacher_identity_key`, `funded_by_wallet`, `funded_by_donation_id`, `donor_note`, `source_url`, `source_asin`
- `services/classroomNeeds.ts` calls RPC functions instead of `select('*')`
- Realtime removed (not needed — public reads go through RPC)

### [P0] Classroom-needs campaign removed from donor dropdown

- Removed `classroom-needs` entry from `CAMPAIGN_OPTIONS` in `donationConfig.ts`
- Server-side `CAMPAIGN_RULES` in `record-donation/index.ts` still has it for validation
- The generic Give dropdown cannot accidentally trigger a need-mode donation

### [P1] Memo cn validated against request body

- `fetchAndValidateUSDCTransaction()` now extracts `memoCn` from on-chain memo
- `ParsedUSDCTransaction` interface includes `memoCn: string | null`
- Classroom need branch rejects any mismatch: `parsed.memoCn !== classroomNeedId` → 422

### [P1] Purchase orders now idempotent and backfilled from both paths

- Added `UNIQUE` constraint on `purchase_orders.donation_id` in migration
- `record-donation` uses `upsert` with `onConflict: 'donation_id', ignoreDuplicates: true`
- `helius-webhook` now also upserts `purchase_orders` for classroom need donations

---

## Known Risks / Decisions

1. **Migration not yet deployed.** `supabase db push` needed before any integration testing.
2. **`source_url` made nullable** (differs from build handoff which had `NOT NULL`). Matches the runbook's `ClassroomNeed` interface. Some needs may not have a specific product URL.
3. **Proof events use JSON body with `media_type = null`** to avoid schema migration for a new media_type value. UI detects proof blocks by parsing `body.kind === 'proof_event'`.
4. **Webhook claim on conflict still records the donation** — funds are on-chain regardless. The need just isn't claimed by the second donor. Manual admin refund path would be needed.
5. **No seed data inserted yet** — migration creates empty tables. Seed data should be inserted after migration is deployed (Milestone 2/3 or manual SQL).
6. **`teacher_identity_key` remains on base table** — required for the partial unique index (`idx_one_open_per_teacher`). Not exposed to clients because the base table has no public SELECT policy.

---

## Next: Milestone 2

UI work: `CampaignsScreen` (3-mode toggle, NeedCard), `NeedDetailScreen`, `GiveScreen` (need mode), `AppNavigator` (route params).
