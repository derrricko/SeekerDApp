# Handoff: USDC Pivot Implementation

Date: 2026-02-27
Repo: `SeekerDApp`
Branch: `v2/give-portal`
Author: Claude Code (Opus)
Status: **Plan approved, implementation starting**

---

## Summary

This document describes the full scope of work to pivot Glimpse from native SOL transfers to USDC (SPL token) transfers. It covers every file being changed, the reasoning behind each change, the order of operations, risk areas, and verification steps.

The pivot was triggered by the founder's decision to align the app with the original product vision: USDC donations with a 48-hour custodial refund window, cause-preference matching, and transparent communication via message threads.

---

## What's Changing (High Level)

| Before (SOL) | After (USDC) |
|---|---|
| `SystemProgram.transfer` (native SOL) | `createTransferCheckedInstruction` (SPL USDC) |
| Flat recipient picker (4 recipients) | Cause preference multi-select (6 causes, max 3) |
| All SOL goes to one wallet | All USDC goes to matching pool wallet |
| No hold period | 48-hour custodial hold tracked in Supabase |
| `amount_sol` in DB | `amount_usdc` in DB + `hold_status` + `hold_expires_at` |
| Memo: `{d,r,a,t,app,c}` | Memo: `{d,r,a,t,app,tok,c}` (adds `tok:"usdc"`) |
| Edge fn validates system transfer | Edge fn validates SPL `transferChecked` + USDC mint |

## What's NOT Changing

- MWA wallet connection + signing (token-agnostic)
- Wallet-signed auth flow (ed25519 → JWT)
- Chat/messaging architecture (Supabase Realtime)
- RLS policies (wallet-scoped)
- Retry queue pattern (AsyncStorage)
- Navigation structure (4 tabs)
- HowItWorksCarousel (user editing separately)

---

## Implementation Phases (Ordered by Dependency)

### Phase 0: Foundation — Zero Behavioral Change

These are safe, additive changes that fix review findings and prepare the codebase.

#### 0.1 — Install `@solana/spl-token`

**File:** `package.json`

Add `"@solana/spl-token": "^0.3.11"` to dependencies. This is the v0.3.x line compatible with `@solana/web3.js` v1 (which Anchor + MWA require).

**Why v0.3.x:** The v0.4.x+ line uses web3.js v2 types (`Address`, `Signer`) which are incompatible with our `PublicKey`/`Transaction` objects.

**Verification:** Bundle check passes after install.

#### 0.2 — Fix Migration 004 SQL Syntax

**File:** `supabase/migrations/004_v2_donation_cadence_and_stage.sql`

**Problem:** The current file has invalid PostgreSQL syntax:
```sql
-- BROKEN: CHECK cannot be on same statement as ADD COLUMN without CONSTRAINT keyword
alter table if exists public.donations
  add column if not exists cadence text not null default 'one_time'
  check (cadence in ('one_time', 'daily'));
```

**Fix:** Split into separate DDL statements:
```sql
ALTER TABLE IF EXISTS public.donations
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'one_time';

ALTER TABLE IF EXISTS public.donations
  ADD CONSTRAINT chk_donations_cadence CHECK (cadence IN ('one_time', 'daily'));

ALTER TABLE IF EXISTS public.donations
  ADD COLUMN IF NOT EXISTS impact_stage text NOT NULL DEFAULT 'processing';

ALTER TABLE IF EXISTS public.donations
  ADD CONSTRAINT chk_donations_impact_stage CHECK (impact_stage IN ('processing', 'completed'));

CREATE INDEX IF NOT EXISTS idx_donations_stage ON public.donations(impact_stage);
```

**Why this matters:** Without this fix, `supabase db push` or migration deployment will fail with a syntax error. This is a hard blocker for any deployment.

#### 0.3 — Consolidate `DonationCadence` Type (DRY Fix)

**Problem:** `DonationCadence` is defined in two places:
- `components/providers/AppStateProvider.tsx:9`
- `services/donations.ts:34`

**Fix:** Move canonical definition to `data/donationConfig.ts` (which already has donation-related types like `DonationMode` and `CauseOption`). Update all imports.

**Files touched:**
- `data/donationConfig.ts` — add `export type DonationCadence = 'one_time' | 'daily';`
- `services/donations.ts` — delete line 34, import from donationConfig
- `components/providers/AppStateProvider.tsx` — import from donationConfig
- `screens/GiveScreen.tsx` — import from donationConfig (was importing from AppStateProvider)

#### 0.4 — Export `RootTabParamList` for Typed Navigation

**File:** `navigation/AppNavigator.tsx:19`

**Change:** `type RootTabParamList` → `export type RootTabParamList`

Then update screens to use typed hooks instead of `useNavigation<any>()`:
- `screens/GiveScreen.tsx`
- `screens/MessagesScreen.tsx`
- `screens/CampaignsScreen.tsx`

This catches navigation parameter typos at compile time.

---

### Phase 1: Schema Migration

#### 1.1 — New Migration: `005_v2_usdc_hold_tracking.sql`

**New file:** `supabase/migrations/005_v2_usdc_hold_tracking.sql`

```sql
-- Rename amount column (no production data, safe for hackathon)
ALTER TABLE public.donations RENAME COLUMN amount_sol TO amount_usdc;

-- 48-hour custodial hold tracking
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS hold_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.donations
  ADD CONSTRAINT chk_donations_hold_status
  CHECK (hold_status IN ('pending', 'locked', 'released', 'refunded'));
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS hold_expires_at timestamptz;

-- Cause preferences (JSONB array of cause IDs)
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS cause_preferences jsonb DEFAULT '[]'::jsonb;

-- Admin query index
CREATE INDEX IF NOT EXISTS idx_donations_hold_status ON public.donations(hold_status);
```

**Hold status state machine:**
```
  pending ──(48h expires)──▶ locked ──(admin action)──▶ released
     │
     └──(donor requests)──▶ refunded
```

- `pending`: donation received, within 48-hour refund window
- `locked`: 48 hours passed, funds committed (transition is manual for hackathon)
- `released`: funds directed to matched need
- `refunded`: donor requested and received manual refund

**`hold_expires_at`** is set at insert time: `NOW() + INTERVAL '48 hours'`

**`cause_preferences`** stores an array like `["transportation", "housing"]` — the causes the donor selected to help with matching.

---

### Phase 2: Transfer Builder Rewrite (HIGHEST RISK)

#### 2.1 — Full Rewrite of `utils/transfer.ts`

**File:** `utils/transfer.ts`

This is the core change. Replace the SOL transfer with an SPL token (USDC) transfer.

**Current flow:**
```
SystemProgram.transfer(donor → recipient, lamports)
+ Memo instruction
= 2 instructions in one atomic tx
```

**New flow:**
```
[Optional] createAssociatedTokenAccountInstruction (if recipient ATA missing)
+ createTransferCheckedInstruction(donorATA → recipientATA, rawAmount, mint, decimals)
+ Memo instruction
= 2-3 instructions in one atomic tx
```

**Key implementation details:**

1. **ATA derivation:** Use `getAssociatedTokenAddress(mint, wallet)` to derive the Associated Token Account for both donor and recipient.

2. **Pre-flight balance check:** Before building the tx, call `getAccount(connection, donorATA)` to verify the donor has a USDC token account and sufficient balance. This gives a clean error message instead of a confusing simulation failure.

3. **Recipient ATA creation:** If the matching pool wallet doesn't have a USDC ATA, include `createAssociatedTokenAccountInstruction` in the tx (donor pays ~0.002 SOL rent). In practice, the pool wallet's ATA should be pre-created.

4. **`createTransferCheckedInstruction`:** Preferred over `createTransferInstruction` because it validates the mint address and decimals on-chain, preventing wrong-token transfers.

5. **Amount math:** USDC has 6 decimals. `1 USDC = 1,000,000 raw units`. Use `Math.round(amountUSDC * 10 ** 6)`.

6. **Safety cap:** 10,000 USDC per transaction.

7. **Memo format update:**
```json
{"d":"HQ5C58Tu","r":"4vGRAMXy","a":5.00,"t":1709000000,"app":"glimpse","tok":"usdc","c":"one_time"}
```
New field: `tok: "usdc"` — identifies the token used. Keeps memo backward-compatible (old donations had no `tok` field = SOL).

**New imports from `@solana/spl-token`:**
- `getAssociatedTokenAddress`
- `createAssociatedTokenAccountInstruction`
- `createTransferCheckedInstruction`
- `getAccount`
- `TokenAccountNotFoundError`

**Existing imports preserved:** `Connection`, `PublicKey`, `Transaction`, `TransactionInstruction` from `@solana/web3.js`.

**Fallback plan:** If `@solana/spl-token` has polyfill issues in React Native 0.76/Hermes:
- Derive ATAs manually: `PublicKey.findProgramAddressSync([wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], ATA_PROGRAM_ID)`
- Build `transferChecked` instruction from raw buffer encoding (the instruction data layout is well-documented)

---

### Phase 3: Error Handling + Retry Queue

#### 3.1 — Update `utils/errors.ts`

**Changes:**
- `INSUFFICIENT_SOL` → `INSUFFICIENT_USDC`
- Message: "Not enough SOL in your wallet" → "Not enough USDC in your wallet for this donation."
- New error code: `USDC_ACCOUNT_NOT_FOUND` — "No USDC found in your wallet. Add USDC to donate."
- Pattern match: `insufficient lamports` stays (still needed for tx fee SOL), add `Insufficient USDC` and `USDC token account not found`

#### 3.2 — Update `utils/retry.ts`

**Changes:**
- `PendingConversation.amountSOL` → `amountUSDC`
- Add field: `causePreferences: string[]`
- Backward compatibility: `getPendingConversations()` checks for legacy `amountSOL` field and maps it (avoids losing orphaned retries from SOL era)

---

### Phase 4: Donation Service

#### 4.1 — Update `services/donations.ts`

**Parameter changes in `executeDonation()`:**
- `amountSOL` → `amountUSDC`
- Add `causePreferences: string[]` parameter
- Forward `causePreferences` to edge function: `JSON.stringify({txSignature, recipientId, causePreferences})`

**Edge function call body (new):**
```json
{
  "txSignature": "5abc...xyz",
  "recipientId": "matching-pool",
  "causePreferences": ["transportation", "housing"]
}
```

**Retry queue update:** `addPendingConversation` includes `amountUSDC` and `causePreferences`.

---

### Phase 5: Edge Function Rewrite (SECOND HIGHEST RISK)

#### 5.1 — Rewrite `supabase/functions/record-donation/index.ts`

**Transaction validation — current vs new:**

```
CURRENT (SOL):                          NEW (USDC):
─────────────────────                   ─────────────────────
Find ix.program === 'system'            Find ix.program === 'spl-token'
Find ix.parsed.type === 'transfer'      Find ix.parsed.type === 'transferChecked'
Read ix.parsed.info.source              Read ix.parsed.info.authority (signer)
Read ix.parsed.info.destination         Read ix.parsed.info.destination (ATA)
Read ix.parsed.info.lamports            Read ix.parsed.info.tokenAmount.amount
Divide by 1e9 → SOL                    Read ix.parsed.info.tokenAmount.decimals
                                        Validate ix.parsed.info.mint === USDC_MINT
                                        Validate destination === POOL_USDC_ATA
                                        Divide amount by 10^decimals → USDC
```

**New constants in edge function:**
```typescript
const USDC_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'; // devnet
const USDC_DECIMALS = 6;
const MATCHING_POOL_WALLET = '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T';
const MATCHING_POOL_USDC_ATA = '<pre-computed>'; // derived once, hardcoded
```

**Why hardcode the ATA?** The edge function runs in Deno and cannot import `@solana/spl-token`. Rather than implementing PDA derivation in Deno, we pre-compute the matching pool's USDC ATA address once and hardcode it. Since there's exactly one recipient (the pool wallet), this is safe and eliminates a runtime dependency.

**ATA pre-computation:** Run locally before implementation:
```bash
# Derive the ATA for the matching pool wallet + devnet USDC mint
npx ts-node -e "
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const { PublicKey } = require('@solana/web3.js');
const ata = await getAssociatedTokenAddress(
  new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  new PublicKey('4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T')
);
console.log(ata.toBase58());
"
```

**New request body fields:**
- `causePreferences` — array of cause IDs, stored in `donations.cause_preferences`

**Upsert changes:**
- `amount_sol` → `amount_usdc`
- Insert includes: `cause_preferences`, `hold_status: 'pending'`, `hold_expires_at: NOW() + 48h`
- Backward compat fallback: if `amount_usdc` column doesn't exist (pre-migration), retry with `amount_sol`

**Welcome message (cadence-aware, USDC):**
- One-time: "Your donation of {amount} USDC is being processed. We are connecting you to a need based on the data and information you provided us. We will be reaching out with updates in this message thread. Remember you have 48 hours to request a refund."
- Daily: "Your daily commitment of {amount} USDC is being processed. We are connecting you to a need based on the data and information you provided us. We will be reaching out with updates in this message thread. Remember you have 48 hours to request a refund."

**CORS hardening:** Lock `Access-Control-Allow-Origin` to `https://giveglimpse.com` (deployment-ready).

**Memo validation updates:**
- Check `memo.tok === 'usdc'`
- Amount tolerance: `Math.abs(memoAmount - amountUSDC) > 1e-6` (6 decimals, not 9)

---

### Phase 6: UI Changes

#### 6.1 — GiveScreen: Cause Preferences + USDC

**File:** `screens/GiveScreen.tsx`

**Imports change:**
- Remove: `RECIPIENTS` from `data/recipients.ts`
- Add: `CAUSE_OPTIONS`, `MATCHING_POOL` from `data/donationConfig.ts`

**State changes:**
- Remove: `selectedRecipientId` (single string)
- Add: `selectedCauses: string[]` (multi-select, max 3)

**UI changes:**
- Replace recipient button grid with cause preference multi-select chips
- Label: "DESTINATION" → "CAUSE PREFERENCES (pick up to 3)"
- Helper text: recipient description → "Help us match your donation to the right need."
- Amount label context: "SOL" → "USDC"
- Validation: "Enter an amount between 0.01 and 100 SOL" → "Enter an amount between 1 and 10,000 USDC"
- Confirm screen: "{amount} SOL" → "{amount} USDC"
- Done screen: Add hold status message (founder-approved copy):

> "Your donation is being processed. We are connecting you to a need based on the data and information you provided us. We will be reaching out with updates in the message thread. Remember you have 48 hours to request a refund."

**`executeDonation()` call updates:**
- `selectedRecipient.wallet` → `MATCHING_POOL.wallet`
- `selectedRecipient.id` → `MATCHING_POOL.id`
- `amount` (SOL) → `amount` (USDC, same variable name)
- Add `selectedCauses` parameter

#### 6.2 — MessagesScreen: SOL → USDC Display

**File:** `screens/MessagesScreen.tsx`

- `amount_sol` → `amount_usdc` in amount extraction (line ~197)
- `{amount} SOL` → `{amount} USDC` in thread list (line ~277)
- `{amount} SOL` → `{amount} USDC` in chat header (line ~389)
- Import `getRecipientLabel` from `donationConfig.ts` instead of using `RECIPIENTS`

#### 6.3 — chat.ts: Column Rename

**File:** `services/chat.ts`

- `Conversation.amount_sol` → `amount_usdc` in interface (line ~26)
- Select query: `donations(amount_usdc, recipient_id)` (line ~39)
- Mapping: `c.donations?.amount_usdc` (line ~47)

#### 6.4 — AppStateProvider: Cosmetic SOL → USDC

**File:** `components/providers/AppStateProvider.tsx`

- Line ~288-289: Feed post body strings change "SOL" → "USDC"
- Move `DonationCadence` import to `donationConfig.ts` (Phase 0.3)

---

### Phase 7: Tests + Documentation

#### 7.1 — Money-Critical Path Tests

**New file:** `__tests__/transfer.test.ts`
- Memo format includes `tok: "usdc"` and correct USDC amount
- Amount conversion: `1 USDC` → `1,000,000` raw units
- Amount conversion: `0.01 USDC` → `10,000` raw units
- Safety cap rejects > 10,000 USDC
- Zero/negative amount throws error

**New file:** `__tests__/errors.test.ts`
- `handleTransactionError("Insufficient USDC")` → `{code: 'INSUFFICIENT_USDC', ...}`
- `handleTransactionError("USDC token account not found")` → `{code: 'USDC_ACCOUNT_NOT_FOUND', ...}`
- Existing SOL lamports error still maps correctly (needed for tx fee errors)

#### 7.2 — Update CLAUDE.md

- "SOL Donation Flow" → "USDC Donation Flow"
- Memo format: document `tok` field
- Key packages: add `@solana/spl-token`
- Data flow diagram: update for USDC + cause preferences
- Remove `@solana/spl-token` from "Removed from v1" list

---

## Complete File List (16 files)

| # | File | Change | Risk |
|---|---|---|---|
| 1 | `package.json` | Add `@solana/spl-token` dep | Low |
| 2 | `supabase/migrations/004_v2_donation_cadence_and_stage.sql` | Fix SQL syntax | Low |
| 3 | `supabase/migrations/005_v2_usdc_hold_tracking.sql` | **New** — USDC cols + hold tracking | Low |
| 4 | `data/donationConfig.ts` | Add `DonationCadence` export | Low |
| 5 | `navigation/AppNavigator.tsx` | Export `RootTabParamList` | Low |
| 6 | `utils/transfer.ts` | **Full rewrite** — SPL token transfer | **HIGH** |
| 7 | `utils/errors.ts` | SOL → USDC error messages | Low |
| 8 | `utils/retry.ts` | Rename `amountSOL`, add `causePreferences` | Low |
| 9 | `services/donations.ts` | Param renames, cause forwarding | Medium |
| 10 | `services/chat.ts` | `amount_sol` → `amount_usdc` | Low |
| 11 | `supabase/functions/record-donation/index.ts` | **Major rewrite** — SPL validation | **HIGH** |
| 12 | `screens/GiveScreen.tsx` | Cause UI, USDC labels, hold message | Medium |
| 13 | `screens/MessagesScreen.tsx` | SOL → USDC display | Low |
| 14 | `components/providers/AppStateProvider.tsx` | SOL → USDC strings, type import | Low |
| 15 | `__tests__/transfer.test.ts` | **New** — money-critical tests | Low |
| 16 | `__tests__/errors.test.ts` | **New** — error mapping tests | Low |

Plus `CLAUDE.md` documentation update.

---

## Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| `@solana/spl-token` polyfill issues in RN 0.76 Hermes | **High** | Fallback: manual ATA derivation via `PublicKey.findProgramAddressSync` + raw instruction buffer encoding |
| Edge fn cannot derive ATA in Deno runtime | Medium | Pre-compute pool USDC ATA, hardcode as constant |
| Devnet USDC not available for testing | Medium | Mint test USDC via `spl-token mint` CLI command |
| Migration column rename breaks running queries | Low | No production data. If needed, add new column instead of rename |
| MWA behavior with SPL token tx | Low | MWA is transaction-agnostic — signs any `Transaction` bytes |

---

## Verification Plan

### After each phase: Bundle check
```bash
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output /tmp/test.bundle
```

### After Phase 7: Automated tests
```bash
npm test -- --watch=false --watchman=false
npx tsc --noEmit
npm run lint -- --max-warnings=0
```

### E2E on device/emulator (after all phases):

1. **Setup:** Fund test wallet with devnet SOL (for tx fees) + devnet USDC
2. **Connect:** Tap DONATE → carousel → Open App → Connect Wallet via MWA
3. **Donate:**
   - Select 2 causes (e.g., Transportation, Housing)
   - Enter 1 USDC
   - Choose "One-time"
   - Continue → Confirm → Send → Sign in MWA
4. **Verify on-chain** (Solana Explorer):
   - Transaction contains `transferChecked` instruction
   - Token mint = devnet USDC (`4zMMC9...`)
   - Memo: `{"d":"...","r":"...","a":1,"t":...,"app":"glimpse","tok":"usdc","c":"one_time"}`
5. **Verify in Supabase:**
   - `donations` row: `amount_usdc = 1`, `hold_status = 'pending'`, `hold_expires_at` = +48h, `cause_preferences = '["transportation","housing"]'`
   - `conversations` row created with `donation_id` FK
   - Welcome message contains "USDC" and refund window language
6. **Verify UI:**
   - Done screen shows hold message
   - "Open Thread" navigates to Messages with correct thread
   - Thread shows "1.00 USDC" not "SOL"
7. **Error paths:**
   - 0 USDC balance → "No USDC found in your wallet"
   - Amount exceeds balance → "Not enough USDC"
   - Decline in MWA → "Transaction cancelled"

---

## Decisions Already Made (Locked)

| Decision | Choice | Rationale |
|---|---|---|
| Hold mechanism | Custodial (manual refund) | No Solana program deployment, simpler |
| Group pooling | Deferred (manual setup) | Too complex for Monday deadline |
| USDC safety cap | 10,000 USDC | High enough for meaningful donations |
| Carousel | Leave as-is | User editing separately |
| CORS | Lock to app origin | Deployment-ready |
| Deep-link race | Accept as-is | Edge fn is fast enough for demo |
| Shared wallet | By design | All donations to founder's wallet |
| spl-token version | v0.3.x | web3.js v1 compatibility required |
| ATA in edge fn | Pre-computed, hardcoded | No spl-token in Deno runtime |

---

## NOT in Scope

- Carousel copy rewrite (user editing separately)
- Group pool creation UI
- Automated refund logic
- Matching algorithm
- CampaignsScreen → specific thread deep-link
- Conversation pagination
- On-chain escrow program
