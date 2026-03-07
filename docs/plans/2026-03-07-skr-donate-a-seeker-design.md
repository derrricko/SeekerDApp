# SKR Integration: "Donate a Seeker" Campaign

**Date:** 2026-03-07
**Status:** Approved
**Goal:** Win the $10,000 SKR Integration Bonus at Monolith hackathon

## Summary

Add a 4th campaign option — "Donate a Seeker" — that accepts $SKR token donations. When the campaign is selected, the Give flow switches from USDC to SKR. The transaction uses the same `transferChecked` + Memo pattern, same MWA signing flow, same server-side validation. SKR donors are eligible for 2x points when Seasons launch.

Glimpse converts pooled SKR to USD off-chain when the campaign reaches its $500 target, then purchases and ships a Seeker device to someone in need.

**Important:** This feature touches both the write path (Give flow, edge functions) AND the read path (feed, Messages, conversation list, helius enhanced tx parsing). Both must be updated to avoid SKR donations rendering as `$0.00 USDC`.

## SKR Token Details

- **Mint:** `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3`
- **Decimals:** 6 (same as USDC)
- **Symbol:** SKR
- **Price:** ~$0.024 (volatile)
- **Program:** SPL Token (standard, not Token-2022)
- **Price API:** `https://lite-api.jup.ag/price/v2?ids=SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3`

## Design

### Campaign Definition

New entry in `CAMPAIGN_OPTIONS` array in `data/donationConfig.ts`:

```typescript
{
  id: 'donate-a-seeker',
  label: 'Donate a Seeker with $SKR',
  glimpseTag: '#004',
  summary: 'Pool SKR to fund a Solana Seeker device for someone in need. When the campaign hits $500, we buy the Seeker and ship it. You see the proof.',
  causePreferences: ['seeker-device', 'skr-integration'],
  minimumUSDC: 0,     // not used for SKR
  minimumSKR: 100,    // ~$2.40 at current price
  token: 'skr',       // new field — defaults to 'usdc' for existing campaigns
}
```

The `CampaignOption` type gains two new optional fields: `token` (defaults `'usdc'`) and `minimumSKR`.

### Give Flow Changes

When `selectedCampaign.token === 'skr'`:

| Element | USDC (default) | SKR |
|---------|---------------|-----|
| Amount label | `AMOUNT (USDC)` | `AMOUNT (SKR)` |
| Amount prefix | `$` | `SKR` (or no prefix) |
| Validation | 0.01–10,000 USDC | 100–100,000,000 SKR |
| Review display | `5.00 USDC` | `10,000 SKR (~$240)` |
| Confirm copy | USDC references | SKR references + 2x points badge |
| Processing copy | `5.00 USDC` | `10,000 SKR` |

USD conversion shown on review/confirm using Jupiter Price API (fetched once when campaign is selected, cached for the session).

### Campaign Card

When "Donate a Seeker" is selected, the campaign summary card shows:
- Campaign description
- "Eligible for 2x points when Seasons launch" badge
- Minimum: 100 SKR

### Transaction Construction (`transfer.ts`)

Currently hardcoded to USDC. Parameterize to accept any SPL token:

**Before:** `buildDonationTransaction(connection, donor, recipient, amountUSDC, cadence)`

**After:** `buildDonationTransaction(connection, donor, recipient, amount, cadence, tokenConfig)`

Where `tokenConfig` defaults to USDC:
```typescript
interface TokenConfig {
  mint: string;
  decimals: number;
  symbol: string;  // 'usdc' | 'skr' — used in memo tok field
}
```

Changes inside the function:
- Use `tokenConfig.mint` instead of `USDC_MINT`
- Use `tokenConfig.decimals` instead of `USDC_DECIMALS`
- Set `memo.tok` to `tokenConfig.symbol`
- Adjust max cap per token (10,000 USDC / 100,000,000 SKR)
- Error messages reference the token symbol, not hardcoded "USDC"

### Donation Service (`services/donations.ts`)

- `executeDonationSeamless` gains an optional `tokenConfig` parameter (defaults USDC)
- Passes `tokenConfig` through to `buildDonationTransaction`
- The `DonationMemo.tok` field already supports arbitrary strings
- Fallback memo in `confirmAndRecord` uses `tokenConfig.symbol` instead of hardcoded `'usdc'`

### Retry Queue (`utils/retry.ts`)

The `PendingConversation` interface and all retry logic must become token-aware:

- Rename `amountUSDC` → `amount` in the interface
- Add `tokenType: DonationToken` field (defaults `'usdc'` for backward compat with existing queued items)
- Fallback memos in `confirmAndRecord` reference `tokenConfig.symbol`
- Parse legacy queue entries: if `amountUSDC` present and no `tokenType`, treat as USDC

### Read Path — Donation Display Helper

**New:** `utils/donationDisplay.ts` — single source of truth for rendering donation amounts:

```typescript
export interface DonationDisplay {
  amount: number;
  symbol: string;       // 'USDC' | 'SKR'
  formatted: string;    // '$5.00 USDC' or '10,000 SKR'
  tokenType: DonationToken;
}

export function getDonationDisplay(item: {
  amount_usdc?: number;
  amount_skr?: number;
  token_type?: string;
}): DonationDisplay
```

This helper is consumed by:

- `services/chat.ts` — `fetchConversations` select must include `amount_skr, token_type`; `Conversation` type adds these fields; `DonationHistoryItem` adds them; `queryDonations` select must include them; `mapDonationRow` uses `getDonationDisplay`
- `services/helius.ts` — `parseEnhancedTransaction` checks both USDC and SKR mints; `EnhancedDonation` type gains `tokenType` field
- `screens/CampaignsScreen.tsx` — feed cards use `getDonationDisplay` instead of `${item.amount_usdc.toFixed(2)} USDC`
- `screens/MessagesScreen.tsx` — conversation list amount uses `getDonationDisplay`; thread header uses display helper instead of `{amount} USDC`

### Server-Side Validation (`record-donation/index.ts`)

Current state: validates `mint === USDC_MINT`, `destination === MATCHING_POOL_USDC_ATA`, `memo.tok === 'usdc'`.

Changes:
1. Add `SKR_MINT` constant and `MATCHING_POOL_SKR_ATA` constant (pre-derived)
2. Create `VALID_TOKEN_MINTS` map: `mint → { ata, decimals, symbol, maxAmount }`
3. Validation function becomes mint-aware:
   - Look up mint in `VALID_TOKEN_MINTS` → get expected ATA + decimals
   - Validate destination matches the token-specific ATA
   - Validate memo `tok` matches the token symbol
   - Apply token-specific max amount cap
4. **Token-aware minimum enforcement:**
   - Campaign rules gain `minimumSKR` field
   - Minimum check branches on detected token type:
     - `usdc` → `parsed.amount < selectedCampaign.minimumUSDC`
     - `skr` → `parsed.amount < selectedCampaign.minimumSKR`
5. Campaign rule for `donate-a-seeker` added to `CAMPAIGN_RULES`
6. `amount_usdc` column used for USDC; new `amount_skr` column for SKR; `token_type` tracks which
7. Welcome message references SKR amount when `token_type = 'skr'`
8. **Upsert enrichment on reconciliation:** When `upsertDonation` finds an existing row (webhook-first race), update `recipient_id`, `cause_preferences`, `donation_mode`, and `token_type` if the existing row has `recipient_id = 'general'` (webhook fallback data). This fixes the webhook-first race for both USDC and SKR.

### Helius Webhook (`helius-webhook/index.ts`)

- Add SKR mint to transfer detection (alongside USDC)
- Accept `tok === 'skr'` in memo extraction
- Populate `amount_skr` + `token_type = 'skr'` for SKR transfers
- **SKR-specific improvement:** When mint is SKR, webhook can safely write `recipient_id: 'donate-a-seeker'` instead of `'general'`, because SKR uniquely identifies that campaign

### Database Migration

New migration (018):
```sql
-- Support SKR token donations alongside USDC
ALTER TABLE donations ADD COLUMN amount_skr NUMERIC(18,6) NOT NULL DEFAULT 0;
ALTER TABLE donations ADD COLUMN token_type TEXT NOT NULL DEFAULT 'usdc';
ALTER TABLE donations ADD CONSTRAINT donations_token_type_check
  CHECK (token_type IN ('usdc', 'skr'));
```

No RLS changes — existing policies work (scoped by wallet, not token).

### Points System

**Not implemented in code for hackathon.** The campaign card displays "Eligible for 2x points when Seasons launch" — softened copy to avoid promising an unbuilt feature. The leaderboard (Rank tab) is already a placeholder. Weighting logic ships post-hackathon when the leaderboard goes live.

**Weighting design (for future):** Points = USD value at time of donation. SKR donors get a 2x multiplier. Normalized across tokens so a $10 USDC donation and ~$10 worth of SKR earn comparable base points.

### Prerequisites

1. **Derive SKR ATA for pool wallet.** Run on client or CLI:
   ```
   getAssociatedTokenAddress(SKR_MINT, MATCHING_POOL_WALLET) → MATCHING_POOL_SKR_ATA
   ```
   Pre-create the ATA so the first donor doesn't pay rent.

2. **Deploy migration 018** to Supabase.

3. **Deploy updated edge functions** (`record-donation`, `helius-webhook`).

## What Does NOT Change

- MWA signing flow (same `authorizeSignAndBuild` pattern)
- Two-phase sign+send architecture
- Supabase conversation/chat creation
- Existing USDC campaigns (untouched)
- Navigation structure
- Auth flow

## What DOES Change (Beyond Write Path)

These were missed in v1 of this doc and caught in Codex review:

- **Retry queue** (`utils/retry.ts`) — `PendingConversation` gains `tokenType`, `amount` replaces `amountUSDC`
- **Chat service** (`services/chat.ts`) — selects, types, and mappers include `amount_skr`, `token_type`
- **Helius service** (`services/helius.ts`) — parses SKR transfers alongside USDC; `EnhancedDonation` gains `tokenType`
- **Feed screen** (`screens/CampaignsScreen.tsx`) — uses `getDonationDisplay()` instead of `amount_usdc.toFixed(2) USDC`
- **Messages screen** (`screens/MessagesScreen.tsx`) — conversation list + thread header use `getDonationDisplay()`
- **Webhook reconciliation** (`record-donation/index.ts`) — enriches webhook-first rows on client record

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| SKR ATA doesn't exist on pool wallet | Certain (first time) | Pre-create before launch |
| Jupiter Price API down | Low | Fallback: show SKR amount only, no USD estimate |
| SKR liquidity too thin for large donations | Low | Cap at 100M SKR; off-chain conversion is manual |
| Edge function rejects SKR tx | Medium | Test with small mainnet donation before demo |
| Breaks existing USDC flow | Low | SKR is additive; USDC path unchanged |
| SKR donations render as 0.00 USDC | **High if missed** | Read-path updates are mandatory (P1) |
| Webhook-first race loses campaign identity | Medium | Enrich on client record + SKR auto-maps to donate-a-seeker |
| Retry queue drops token info | Medium | Make `PendingConversation` token-aware |

## Narrative for Judges

> "Glimpse is the first app where you can donate your SKR to put a Seeker in someone's hands. Every SKR contributed goes toward funding a device for someone who needs it. When the campaign hits $500, we buy the Seeker and ship it — then you see the proof and start a conversation with the person who received it. SKR donors are eligible for 2x points when Seasons launch."

## File Change Summary

| File | Type | Description |
|------|------|-------------|
| `config/env.ts` | Edit | Add `SKR_MINT`, `SKR_DECIMALS` |
| `data/donationConfig.ts` | Edit | Add `token` field to type, add 4th campaign, add `ALLOWED_CAUSE_PREFERENCES` for new causes |
| `utils/transfer.ts` | Edit | Parameterize mint/decimals/symbol via `TokenConfig`, adjust error messages |
| `services/donations.ts` | Edit | Pass `tokenConfig` through to `buildDonationTransaction` |
| `screens/GiveScreen.tsx` | Edit | Conditional labels, prefix, validation, USD conversion display, points badge |
| `screens/CampaignsScreen.tsx` | Edit | Use `getDonationDisplay()` for feed amount rendering |
| `screens/MessagesScreen.tsx` | Edit | Use `getDonationDisplay()` for conversation list + thread header |
| `services/chat.ts` | Edit | Select `amount_skr, token_type`; update types + mappers |
| `services/helius.ts` | Edit | Parse SKR transfers; add `tokenType` to `EnhancedDonation` |
| `utils/donationDisplay.ts` | Create | `getDonationDisplay()` helper — single source of truth |
| `utils/retry.ts` | Edit | Add `tokenType` + `amount` fields, backward compat for legacy entries |
| `supabase/functions/record-donation/index.ts` | Edit | Multi-token validation, token-aware minimums, webhook reconciliation enrichment |
| `supabase/functions/helius-webhook/index.ts` | Edit | SKR mint detection, memo tok=skr, auto-map SKR→donate-a-seeker |
| `supabase/migrations/018_skr_donations.sql` | Create | Add `amount_skr NUMERIC(18,6)`, `token_type` with CHECK constraint |
