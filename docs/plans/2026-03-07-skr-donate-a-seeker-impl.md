# Implementation Plan: SKR "Donate a Seeker" Campaign

**Design doc:** `docs/plans/2026-03-07-skr-donate-a-seeker-design.md`
**Estimated steps:** 8
**Risk level:** Low-Medium (additive feature, same architecture)

## Dependency Graph

```
Step 1 (config) ──┐
                   ├── Step 3 (transfer.ts) ── Step 4 (donations.ts) ── Step 7 (GiveScreen)
Step 2 (donationConfig) ┘
                                                                         │
Step 5 (migration) ── Step 6a (record-donation) ──────────────────── Step 8 (deploy + test)
                      Step 6b (helius-webhook)  ──────────────────────┘
```

Steps 1-2 can run in parallel. Steps 6a-6b can run in parallel. Step 8 is sequential (requires all prior).

---

## Step 1: Add SKR constants to `config/env.ts`

**File:** `config/env.ts`

Add after the USDC constants (line 54):

```typescript
// SKR (Seeker) token — Solana Mobile ecosystem token
export const SKR_MINT = 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3';
export const SKR_DECIMALS = 6;

// Jupiter Price API for SKR→USD conversion
export const JUPITER_PRICE_API = 'https://lite-api.jup.ag/price/v2';
```

**Verify:** Import compiles. No runtime test needed.

---

## Step 2: Add campaign + type changes to `data/donationConfig.ts`

**File:** `data/donationConfig.ts`

### 2a. Extend `CampaignOption` type

Add optional `token` and `minimumSKR` fields:

```typescript
export type DonationToken = 'usdc' | 'skr';

export interface CampaignOption {
  id: string;
  label: string;
  glimpseTag: string;
  summary: string;
  causePreferences: string[];
  minimumUSDC: number;
  token?: DonationToken;    // defaults 'usdc'
  minimumSKR?: number;      // only for SKR campaigns
}
```

### 2b. Add 4th campaign

Append to `CAMPAIGN_OPTIONS` array:

```typescript
{
  id: 'donate-a-seeker',
  label: 'Donate a Seeker with $SKR',
  glimpseTag: '#004',
  summary:
    'Pool SKR to fund a Solana Seeker device for someone in need. When the campaign reaches $500, we buy the Seeker and ship it. You see the proof. SKR donors earn 2x points in Seasons 1 & 2.',
  causePreferences: ['seeker-device', 'skr-integration'],
  minimumUSDC: 0,
  token: 'skr',
  minimumSKR: 100,
},
```

### 2c. Update dropdown height

In `GiveScreen.tsx`, `CAMPAIGN_OPTIONS.length` drives dropdown height. No code change needed — it reads `.length` dynamically. But `DROPDOWN_ITEM_HEIGHT` may need the list to scroll if 4 items overflow. Check visually.

**Verify:** TypeScript compiles. Existing campaigns unchanged.

---

## Step 3: Parameterize `utils/transfer.ts`

**File:** `utils/transfer.ts`

### 3a. Add `TokenConfig` interface

```typescript
export interface TokenConfig {
  mint: string;
  decimals: number;
  symbol: string;  // 'usdc' | 'skr'
  maxAmount: number;
}

export const USDC_TOKEN_CONFIG: TokenConfig = {
  mint: USDC_MINT,
  decimals: USDC_DECIMALS,
  symbol: 'usdc',
  maxAmount: 10_000,
};

export const SKR_TOKEN_CONFIG: TokenConfig = {
  mint: SKR_MINT,
  decimals: SKR_DECIMALS,
  symbol: 'skr',
  maxAmount: 100_000_000,
};
```

### 3b. Update `buildDonationTransaction` signature

Change:
```typescript
export async function buildDonationTransaction(
  connection: Connection,
  donor: PublicKey,
  recipientAddress: string,
  amount: number,
  cadence: 'one_time' | 'daily',
  tokenConfig: TokenConfig = USDC_TOKEN_CONFIG,
): Promise<{ ... }>
```

### 3c. Replace hardcoded USDC references inside function

- `new PublicKey(USDC_MINT)` → `new PublicKey(tokenConfig.mint)`
- `USDC_DECIMALS` → `tokenConfig.decimals`
- `MAX_USDC` → `tokenConfig.maxAmount`
- `memo.tok = 'usdc'` → `memo.tok = tokenConfig.symbol`
- Error messages: `'USDC'` → `tokenConfig.symbol.toUpperCase()`
- `DonationMemo.a` field: `rawAmount / 10 ** tokenConfig.decimals`

### 3d. Rename parameter

`amountUSDC` → `amount` in the function signature (internal only — callers updated in step 4).

**Verify:** `npx tsc --noEmit` passes. Existing USDC calls still work via default parameter.

---

## Step 4: Thread `tokenConfig` through `services/donations.ts`

**File:** `services/donations.ts`

### 4a. Update `executeDonationSeamless` signature

Add optional `tokenConfig` parameter:

```typescript
export async function executeDonationSeamless(
  connection: Connection,
  recipientWallet: string,
  recipientId: string,
  amount: number,
  cadence: DonationCadence,
  authorizeSignAndBuild: (...) => Promise<WalletSignResult>,
  causePreferences: string[] = [],
  donationMode: DonationMode = 'solo',
  tokenConfig?: TokenConfig,
): Promise<Result<DonationResult>>
```

### 4b. Pass to `buildDonationTransaction`

In the MWA callback (line ~108):
```typescript
const built = await buildDonationTransaction(
  connection, donor, recipientWallet, amount, cadence, tokenConfig,
);
```

### 4c. Update fallback memo in `confirmAndRecord`

The hardcoded `tok: 'usdc'` fallback memo should use `tokenConfig?.symbol || 'usdc'`.

**Verify:** TypeScript compiles. Existing callers pass no `tokenConfig` → defaults to USDC.

---

## Step 5: Database migration

**File:** `supabase/migrations/018_skr_donations.sql` (new)

```sql
-- Support SKR token donations alongside USDC
ALTER TABLE donations ADD COLUMN amount_skr NUMERIC DEFAULT 0;
ALTER TABLE donations ADD COLUMN token_type TEXT DEFAULT 'usdc';
```

**Deploy:** `supabase db push` or apply via dashboard.

**Verify:** Query `SELECT column_name FROM information_schema.columns WHERE table_name = 'donations'` shows new columns.

---

## Step 6a: Update `record-donation` edge function

**File:** `supabase/functions/record-donation/index.ts`

### 6a-i. Add SKR constants

After USDC constants (~line 32):

```typescript
const SKR_MINT = 'SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3';
const SKR_DECIMALS = 6;
// Derive: getAssociatedTokenAddress(SKR_MINT, MATCHING_POOL_WALLET)
const MATCHING_POOL_SKR_ATA = '<DERIVE_THIS>';  // TODO: compute before deploy
```

### 6a-ii. Create multi-token validation map

```typescript
interface TokenMintConfig {
  ata: string;
  decimals: number;
  symbol: string;
  maxAmount: number;
}

const VALID_TOKEN_MINTS: Record<string, TokenMintConfig> = {
  [USDC_MINT_MAINNET]: {
    ata: MATCHING_POOL_USDC_ATA,
    decimals: USDC_DECIMALS,
    symbol: 'usdc',
    maxAmount: 10_000,
  },
  [SKR_MINT]: {
    ata: MATCHING_POOL_SKR_ATA,
    decimals: SKR_DECIMALS,
    symbol: 'skr',
    maxAmount: 100_000_000,
  },
};
```

### 6a-iii. Refactor `fetchAndValidateUSDCTransaction`

Rename to `fetchAndValidateTransaction`. Key changes:

- Look up `mint` in `VALID_TOKEN_MINTS` instead of `VALID_USDC_MINTS.has(mint)`
- Validate `destination` against the token-specific ATA from config
- Validate `memo.tok` against the token-specific symbol
- Use token-specific decimals for amount parsing
- Use token-specific max amount for cap check
- Return a `tokenType` field alongside existing fields

### 6a-iv. Add campaign rule for donate-a-seeker

```typescript
{
  id: 'donate-a-seeker',
  minimumUSDC: 0,
  minimumSKR: 100,
  causePreferences: ['seeker-device', 'skr-integration'],
},
```

Update `ALLOWED_CAUSE_PREFERENCES` to include `'seeker-device'` and `'skr-integration'`.

### 6a-v. Update upsert to store token type

- If `tokenType === 'skr'`: set `amount_skr = parsedAmount`, `amount_usdc = 0`, `token_type = 'skr'`
- If `tokenType === 'usdc'`: set `amount_usdc = parsedAmount`, `amount_skr = 0`, `token_type = 'usdc'`

### 6a-vi. Update welcome message

```typescript
const tokenLabel = tokenType === 'skr' ? `${amount} SKR` : `${amount} USDC`;
body: `... Your donation of ${tokenLabel} is confirmed on-chain ...`
```

**Verify:** Deploy to staging or test with a small mainnet SKR transfer.

---

## Step 6b: Update `helius-webhook` edge function

**File:** `supabase/functions/helius-webhook/index.ts`

### 6b-i. Add SKR mint to transfer detection

Change the `tokenTransfers.find()` predicate to match either USDC or SKR mint.

### 6b-ii. Accept `tok === 'skr'` in memo extraction

All three `extractGlimpseMemo` paths: accept `tok === 'usdc'` OR `tok === 'skr'`.

### 6b-iii. Populate token-specific columns

Set `amount_skr` and `token_type` when the detected mint is SKR.

**Verify:** Check webhook logs after a test SKR donation.

---

## Step 7: Update `screens/GiveScreen.tsx`

**File:** `screens/GiveScreen.tsx`

### 7a. Import new types and config

```typescript
import { USDC_TOKEN_CONFIG, SKR_TOKEN_CONFIG, TokenConfig } from '../utils/transfer';
import { SKR_MINT } from '../config/env';
```

### 7b. Derive token state from selected campaign

```typescript
const isSkr = selectedCampaign?.token === 'skr';
const tokenConfig = isSkr ? SKR_TOKEN_CONFIG : USDC_TOKEN_CONFIG;
const tokenLabel = isSkr ? 'SKR' : 'USDC';
```

### 7c. Conditional amount label

Change `AMOUNT (USDC)` → `AMOUNT (${tokenLabel})`.

### 7d. Conditional prefix

Change `$` prefix to empty or `SKR` when `isSkr`.

### 7e. Conditional validation

```typescript
const min = isSkr ? (selectedCampaign?.minimumSKR || 100) : (selectedCampaign?.minimumUSDC || 0.01);
const max = isSkr ? 100_000_000 : 10_000;
```

### 7f. USD estimate for SKR (optional but nice)

Fetch SKR price from Jupiter when SKR campaign is selected:

```typescript
const [skrPrice, setSkrPrice] = useState<number | null>(null);

useEffect(() => {
  if (!isSkr) return;
  fetch(`https://lite-api.jup.ag/price/v2?ids=${SKR_MINT}`)
    .then(r => r.json())
    .then(data => setSkrPrice(data?.data?.[SKR_MINT]?.price || null))
    .catch(() => {});
}, [isSkr]);
```

Show on review: `10,000 SKR (~$240)` when price is available.

### 7g. 2x points badge on campaign card

When `selectedCampaign?.token === 'skr'`, show a small accent badge:

```
2x POINTS — SEASONS 1 & 2
```

### 7h. Pass tokenConfig to `runDonation`

```typescript
const result = await executeDonationSeamless(
  connection, MATCHING_POOL.wallet, MATCHING_POOL.id, amount, 'one_time',
  authorizeSignAndBuildTransaction, selectedCampaign.causePreferences,
  'solo', tokenConfig,
);
```

### 7i. Update confirm/processing copy

Replace hardcoded "USDC" strings with `tokenLabel`.

### 7j. Update dropdown height

`DROPDOWN_ITEM_HEIGHT * CAMPAIGN_OPTIONS.length` now accounts for 4 items. Verify it doesn't overflow the screen. If it does, add `maxHeight` with scroll.

**Verify:** Visual check on device/emulator. Select each campaign, verify labels switch correctly.

---

## Step 8: Pre-deploy tasks + integration test

### 8a. Derive SKR ATA for pool wallet

Run locally:
```bash
npx ts-node -e "
  const { getAssociatedTokenAddress } = require('@solana/spl-token');
  const { PublicKey } = require('@solana/web3.js');
  getAssociatedTokenAddress(
    new PublicKey('SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3'),
    new PublicKey('DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk'),
  ).then(ata => console.log('SKR ATA:', ata.toBase58()));
"
```

Hardcode the result into `record-donation/index.ts` and `helius-webhook/index.ts`.

### 8b. Pre-create SKR ATA on pool wallet

Send a tiny SKR amount to the pool wallet, or use `spl-token create-account` to create the ATA. This avoids the first donor paying rent.

### 8c. Deploy migration

```bash
supabase db push
```

### 8d. Deploy edge functions

```bash
supabase functions deploy record-donation
supabase functions deploy helius-webhook --no-verify-jwt
```

### 8e. Integration test

1. Select "Donate a Seeker" campaign on device
2. Enter 100 SKR
3. Confirm and sign via MWA
4. Verify tx on Solana Explorer — should show `transferChecked` with SKR mint + memo `tok:"skr"`
5. Verify donation row in Supabase — `amount_skr = 100`, `token_type = 'skr'`
6. Verify conversation + welcome message created
7. Verify existing USDC campaigns still work (regression)

### 8f. Bundle check

```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

---

## Codex Review Checklist

For the reviewer (Codex or human), verify:

- [ ] **No USDC regression.** Existing 3 campaigns work identically. `token` field defaults to `'usdc'` everywhere.
- [ ] **transfer.ts backward compatible.** Default `tokenConfig = USDC_TOKEN_CONFIG` means all existing callers work without changes.
- [ ] **Edge function validates SKR mint strictly.** Only `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3` accepted, not arbitrary mints.
- [ ] **Destination ATA matches token.** USDC tx → USDC ATA. SKR tx → SKR ATA. Cross-token mismatch rejected.
- [ ] **Memo `tok` field matches.** SKR tx must have `tok:"skr"`. USDC tx must have `tok:"usdc"`.
- [ ] **Amount stored in correct column.** SKR → `amount_skr`. USDC → `amount_usdc`. Never mixed.
- [ ] **No Jupiter swap needed.** SKR is transferred directly as SPL token. Off-chain conversion by Glimpse.
- [ ] **Campaign causes don't collide.** `['seeker-device', 'skr-integration']` is unique to the new campaign.
- [ ] **SKR ATA pre-created.** Pool wallet has an initialized SKR token account before launch.
- [ ] **Max amount caps enforced.** 10K USDC / 100M SKR — both client and server.
- [ ] **MWA flow unchanged.** Same two-phase sign+send. No versioned transactions. No new signing pattern.
- [ ] **Helius webhook handles both tokens.** Dual recording (client + webhook) works for SKR.
