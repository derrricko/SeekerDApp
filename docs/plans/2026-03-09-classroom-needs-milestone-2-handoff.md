# Classroom Needs — Milestone 2 Handoff

**Date:** 2026-03-09
**Milestone:** Needs Feed, Detail, Give Mode
**Status:** Complete — ready for Codex review

---

## Files Changed

| File | Change |
|------|--------|
| `navigation/AppNavigator.tsx` | Added `GiveNeedParams`, `GiveDefaultParams` types. `RootTabParamList['Give']` now accepts need params. Added `NeedDetail` hidden tab with `NeedDetailScreen`. Tab bar hidden when NeedDetail active. |
| `ui/NeedCard.tsx` | **NEW** — Single-column editorial card: image/placeholder, price+status badge, title, teacher/school meta, "FUND THIS NEED" CTA for open needs. |
| `ui/AppHeader.tsx` | Added optional `onBack` prop — renders a back arrow button left of the title. |
| `screens/NeedDetailScreen.tsx` | **NEW** — Full detail view: hero image, status badge, price, title, description, teacher/school info, fund CTA (open only), status-appropriate messaging (funded through delivered). |
| `screens/CampaignsScreen.tsx` | 3-mode segmented control: NEEDS (default) → FEED → MY GLIMPSES. Needs tab fetches via `fetchClassroomNeeds()`, renders grouped sections (OPEN NEEDS / IN MOTION / DELIVERED) with `NeedCard` components. Tapping a need navigates to `NeedDetail`. |
| `screens/GiveScreen.tsx` | Detects need mode from route params. Need mode: hides amount input + campaign dropdown, shows pinned summary card with need title/teacher/school/amount, passes `classroomNeedId` to `executeDonationSeamless()`, custom CTA copy ("Fund This Need"), need-specific timeline and processing copy. |

---

## Route Param Contract (Final)

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

RootTabParamList['Give'] = GiveNeedParams | GiveDefaultParams | undefined;
RootTabParamList['NeedDetail'] = { needId: string };
```

---

## Screen Descriptions

### Needs Feed (CampaignsScreen, NEEDS tab)

- 3-pill segmented control: NEEDS | FEED | MY GLIMPSES
- NEEDS is default/first tab
- Sections: "OPEN NEEDS" (green), "IN MOTION" (purple), "DELIVERED" (teal)
- Single-column editorial layout
- Each NeedCard shows: image (or placeholder), price + status badge, title (2 lines max), teacher/school/location, "FUND THIS NEED →" CTA for open items
- Empty state: "No classroom needs right now. Check back soon."

### Need Detail (NeedDetailScreen)

- Back button in AppHeader navigates to Glimpses
- Hero image (or branded placeholder)
- Status badge + price in top row
- Title, description, divider
- Teacher and school info
- Open needs: fund card with "100% OF YOUR DONATION FUNDS THIS ITEM" kicker + PrimaryButton "Fund This Need — $X.XX"
- Non-open needs: muted card with status-appropriate messaging

### Give Mode — Need (GiveScreen)

- Pinned summary card replaces amount input + campaign dropdown
- Shows: title, teacher/school, locked amount
- Copy: "100% of your funding goes to this exact item..."
- Review step: "CLASSROOM NEED" label instead of "CAMPAIGN"
- Confirm button: "Fund This Need" instead of "Confirm and Sign"
- Processing: "NEED FUNDED" title, need-specific message
- Timeline: need-specific steps (review → purchase → delivery proof)

---

## Deliberate Deviations from Layout Spec

1. **NeedDetail as hidden tab** — Used a hidden tab screen (like Rank) rather than a stack navigator. Simpler, avoids adding react-navigation/stack dependency. Back button handles navigation.
2. **No image in Give screen summary** — Route params carry `imageUrl` but the Give form doesn't display it (keeps the form focused). Image is visible in NeedDetail and NeedCard.
3. **Optional fields still shown in need mode** — Match context and note of encouragement remain available. Donors can still send a message with their need funding.

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Clean (0 errors) |
| `npx jest --watchAll=false` | 70/70 tests pass |
| Bundle check | Compiles successfully |

---

## Codex Review Fixes (Post-M2)

### [P0] Need-mode donations blocked by selectedCampaign guard

`runDonation()` had `!validateForm() || !selectedCampaign` which always failed in need mode since `campaignId` is never set. Fixed: guard is now `!validateForm() || (!needMode && !selectedCampaign)`.

### [P1] Give tab stuck in stale need mode

`navigate('Give')` without params kept the previous `GiveNeedParams` route object. Fixed: both `openGiveTab` and `completeGiveFlow` in AppNavigator now explicitly pass `{mode: 'general'}`, resetting any prior need params.

### [P2] Needs feed shows stale availability after funding

The needs fetch only re-ran on `viewMode` change, not on screen re-focus. A just-funded need stayed OPEN visually. Fixed: added `useFocusEffect` that increments a `needsFocusKey` counter, added to the fetch effect's dependency array. Every return to Glimpses triggers a fresh fetch.

### Residual risk: webhook purchase_orders on conflict

Codex flagged this again but the fix was already applied in M1 post-review. `helius-webhook/index.ts:189-204` gates the `purchase_orders` upsert inside the `else` branch — only runs for `'claimed'` or `'already_claimed_same'`, never for `'conflict'`. Verified correct.

---

## Known UI Drift / Polish Gaps

1. **No seed data yet** — Migration not deployed, so needs feed shows empty state. Need manual SQL inserts or migration deployment to test live.
2. **NeedCard image sizing** — 180px fixed height may need adjustment for different aspect ratios. Works well with standard product images.
3. **Tab bar animation** — NeedDetail hides tab bar immediately (no animation). Matches existing Give tab behavior.
4. **AppHeader back button** — Simple circle with arrow. Could be refined in Milestone 3 polish.
5. **Teacher-voice excerpt** — NeedCard shows teacher name and school but not a personal quote/message. Could be added as a `description` truncation or dedicated field in Milestone 3 polish.

---

## Next: Milestone 3

Proof Timeline, Admin Flow Surfaces, Demo Polish: proof event rendering in chat, thread headers with need context, seeded demo content.
