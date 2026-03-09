# Classroom Needs — Claude Milestone Runbook

**Date:** 2026-03-09
**Status:** Execution plan for Claude implementation
**Use for:** hackathon build sequencing, contract lock, milestone handoff back to Codex for audit

---

## 1. Build Mode

Claude is the sole implementation owner for this feature until a milestone is complete.

Codex does not build in parallel during this phase. Codex reviews after each milestone and can take over targeted UI corrections later if the implementation drifts.

This is intentional. It reduces coordination overhead, merge conflicts, and contract churn during a short hackathon sprint.

---

## 2. Source Of Truth

Claude should treat these docs as authoritative, in this order:

1. `docs/plans/2026-03-09-classroom-needs-claude-corrections.md`
2. `docs/plans/2026-03-09-public-school-needs-design-brief.md`
3. `docs/plans/2026-03-09-public-school-needs-layout-spec.md`
4. `docs/plans/2026-03-09-classroom-needs-build-handoff.md`
5. `docs/plans/2026-03-08-classroom-needs-design.md`
6. `docs/handoffs/2026-03-08-codex-classroom-needs-handoff.md`

If any implementation choice conflicts with items 1-3, implementation should pause and the handoff should be updated before code continues.

---

## 3. Locked Product Rules

These are build-fail guardrails.

1. No dropdown-based donor UX for classroom needs.
2. `NEEDS` is the default first view on the Glimpses tab.
3. One donor funds one exact need at one exact amount.
4. A funded need must lock immediately and must not remain fundable.
5. Admin review is an explicit state between funded and purchased.
6. No Amazon branding on donor-facing primary surfaces.
7. Teacher reply and classroom photo are encouraged but not guaranteed.
8. The needs feed is single-column and editorial, not a grid.
9. Private operational data must not live on the publicly readable need row.

---

## 4. Locked Technical Contracts

These contracts should be implemented first and then treated as stable.

### 4.1 `NeedStatus`

Use this exact donor-facing state enum:

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

### 4.2 `ClassroomNeed` shape

Public client-facing need shape should be equivalent to:

```ts
export interface ClassroomNeed {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  source_asin: string | null;
  image_url: string | null;
  price_usdc: number;
  teacher_first_name: string;
  school_name: string;
  school_city: string | null;
  school_state: string | null;
  teacher_identity_key: string;
  status: NeedStatus;
  funded_by_wallet: string | null;
  funded_by_donation_id: string | null;
  donor_note: string | null;
  created_at: string;
  updated_at: string;
}
```

Admin-only fields stay off this public shape.

### 4.3 `Give` route params

Add a typed `Give` route param instead of mutating the existing generic flow through local state.

Recommended shape:

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

type GiveDefaultParams = {
  mode?: 'general';
};
```

`RootTabParamList['Give']` should become `GiveNeedParams | GiveDefaultParams | undefined`.

### 4.4 `executeDonationSeamless(...)`

Keep the current function shape and append the classroom need id as the final optional parameter.

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
  classroomNeedId?: string,
): Promise<Result<DonationResult>>
```

`classroomNeedId` must be the full UUID, not a shortened fragment.

### 4.5 `DonationResult`

Extend the existing result type so retries and success navigation can still identify the need after backend recording completes.

```ts
export interface DonationResult {
  txSignature: string;
  memo: DonationMemo;
  conversationId: string | null;
  donorWallet: string;
  recordError: string | null;
  classroomNeedId?: string | null;
}
```

### 4.6 Message proof contract

Do not add a new `messages.media_type` enum value unless there is a separate migration and type update for it.

Current repo constraint only allows `image | video | receipt | null`.

Use this proof event contract for hackathon speed:

```ts
type ProofEventKind =
  | 'funded'
  | 'under_review'
  | 'purchased'
  | 'delivered'
  | 'classroom_photo_added'
  | 'failed';

type ProofEventBody = {
  kind: 'proof_event';
  event: ProofEventKind;
  label: string;
  detail?: string;
  meta?: Record<string, string | number | boolean | null>;
};
```

Rules:

1. Proof-only status updates use `body = JSON.stringify(ProofEventBody)` and `media_type = null`.
2. Receipt-like proof uses the same JSON body plus `media_type = 'receipt'` and `media_url` if an attachment exists.
3. Normal human messages remain plain text bodies.
4. UI should detect proof blocks by parsing `body.kind === 'proof_event'`.

This avoids schema churn while still giving the UI a structured proof timeline.

### 4.7 Need claim behavior

Need claiming must be:

1. atomic
2. idempotent across `record-donation` and `helius-webhook`
3. exact-amount only
4. full-UUID keyed

The correct outcomes are:

- same donation replays -> success
- open need -> claimed
- different donation on already-claimed need -> conflict / manual refund path
- amount mismatch -> permanent validation failure

---

## 5. Milestone Order

Claude should work in this exact sequence.

Do not start the next milestone until the current milestone is coded, sanity-tested, and summarized in a handoff doc for Codex review.

### Milestone 1 — Data Model, Services, Edge Functions

**Goal:** make classroom needs real in the backend before any donor UI depends on them.

**Primary files**

- `supabase/migrations/018_classroom_needs.sql`
- `supabase/functions/record-donation/index.ts`
- `supabase/functions/helius-webhook/index.ts`
- `services/donations.ts`
- `utils/transfer.ts`
- `utils/retry.ts`
- new `services/classroomNeeds.ts`
- `config/donationConfig.ts`

**Required outcomes**

1. Public `classroom_needs` and private `classroom_need_admin` tables exist with correct RLS.
2. `donations.classroom_need_id` exists and is populated for need-mode donations.
3. Need claim path is atomic and idempotent across client + webhook recording.
4. Exact amount match is enforced server-side.
5. Memo carries full `classroomNeedId`.
6. Need fetch service exists with a stable public shape.
7. Seed/demo data path is possible.

**Do not leave this milestone until**

- migration applies cleanly
- one seeded `open` need can be fetched in app code
- one simulated donation can mark a need funded without race bugs
- replay of the same donation path does not produce a false double-fund

**Milestone 1 handoff doc**

Create:

`docs/plans/2026-03-09-classroom-needs-milestone-1-handoff.md`

Include:

1. files changed
2. final `ClassroomNeed` type
3. final `NeedStatus` enum
4. final `executeDonationSeamless` signature
5. final proof-message contract
6. tests or manual verification run
7. known risks or unresolved choices

### Milestone 2 — Needs Feed, Detail, Give Mode

**Goal:** ship the donor-facing classroom needs flow from browse to payment entry.

**Primary files**

- `navigation/AppNavigator.tsx`
- `screens/CampaignsScreen.tsx`
- new `screens/NeedDetailScreen.tsx`
- `screens/GiveScreen.tsx`
- new `ui/NeedCard.tsx`
- any small shared UI primitives required for the feed

**Required outcomes**

1. `NEEDS` is first/default in the Glimpses segmented control.
2. Needs feed is single-column and editorial.
3. Need cards follow the layout spec.
4. Tapping a need opens a dedicated detail screen.
5. `Give` supports a distinct need mode via route params.
6. Need mode removes campaign dropdown, quick amounts, and open amount entry.
7. Need-mode CTA and copy emphasize exact-item funding.

**Do not leave this milestone until**

- an `open` seeded need can be browsed
- its detail screen renders correctly
- tapping `FUND THIS NEED` opens Give in locked need mode
- the general donation flow still works and is not regressed

**Milestone 2 handoff doc**

Create:

`docs/plans/2026-03-09-classroom-needs-milestone-2-handoff.md`

Include:

1. files changed
2. screenshots or screen descriptions for feed, detail, and give mode
3. final route param contract
4. any deliberate deviations from the layout spec
5. tests or manual verification run
6. known UI drift or polish gaps

### Milestone 3 — Proof Timeline, Admin Flow Surfaces, Demo Polish

**Goal:** close the emotional loop so the feature demos as a proof product, not just a different payment form.

**Primary files**

- `screens/MessagesScreen.tsx`
- `services/chat.ts`
- any admin-triggered proof insertion path used for the demo
- any small visual polish in shared UI needed to align with the layout spec

**Required outcomes**

1. Proof events render distinctly from normal chat bubbles.
2. Thread header carries item context, not only generic donation context.
3. Funded / under review / purchased / delivered / classroom photo states can be displayed in sequence.
4. Seeded demo content covers at least:
   - one `open` need
   - one `purchased` need with receipt proof
   - one `delivered` or `classroom_photo_added` need with classroom update
5. Admin review reads as an intentional trust layer.

**Do not leave this milestone until**

- a donor can land in the thread after funding
- proof events are legible and visually distinct
- seeded proof data supports the full demo narrative

**Milestone 3 handoff doc**

Create:

`docs/plans/2026-03-09-classroom-needs-milestone-3-handoff.md`

Include:

1. files changed
2. final proof rendering contract in practice
3. demo seed states available in the app
4. motion or interaction notes
5. known issues, edge cases, or deferred items

---

## 6. Review Loop

After each milestone:

1. Claude stops coding.
2. Claude writes the milestone handoff doc.
3. Derrick sends that doc to Codex.
4. Codex reviews for:
   - correctness bugs
   - race conditions and regressions
   - design drift from the brief and layout spec
   - hackathon demo risk
5. Only then should Claude continue.

If Codex finds severe issues, the next step is to fix them before new scope is added.

---

## 7. Preferred Demo Story

Claude should keep the demo arc in mind while implementing:

1. donor opens `NEEDS`
2. donor reads a real teacher request
3. donor funds one exact need
4. Glimpse marks it funded and under review
5. donor opens the proof thread
6. donor sees purchase proof
7. donor later sees delivery or classroom update

This is the product. The product is not generic crypto donation flow with a teacher skin on it.

---

## 8. Explicit Non-Goals For The Hackathon

Do not expand scope into these unless all milestones are complete:

1. automated Sp3nd purchasing
2. broad teacher onboarding workflows inside the app
3. referral unlock systems
4. advanced filter/search surfaces
5. donor cart or multi-item checkout
6. public teacher profiles
7. maps or dense marketplace browse tools

---

## 9. Final Deliverable Expectation

By the end of Milestone 3, the fork should be able to demo:

1. a premium mobile-first needs feed
2. exact-item funding flow
3. immediate lock after funding
4. explicit admin review
5. purchase-side proof
6. at least one classroom update example

If an implementation choice helps code speed but weakens this narrative, it is probably the wrong tradeoff.
