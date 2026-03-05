# Helius Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate Helius APIs into Glimpse — faster RPC, enhanced donation feed with on-chain verification, and webhook-based automatic donation recording — for the Monolith hackathon submission (Sunday 2026-03-09).

**Architecture:** Client switches from public Solana RPC to Helius RPC for faster reads. New `services/helius.ts` service fetches enhanced transaction data from Helius API. New `helius-webhook` Supabase edge function receives webhook POSTs when USDC arrives at the pool wallet, auto-recording donations server-side. Existing client-side recording remains as fallback.

**Tech Stack:** Helius Enhanced Transactions API, Helius Webhooks, Supabase Edge Functions (Deno), React Native, TypeScript

---

## Task 1: Install Helius Claude Code Plugin

**Files:**
- Modify: `.claude/settings.json` (or plugin marketplace install)

**Step 1: Install the plugin**

Run:
```bash
claude /plugin marketplace add helius-labs/core-ai
```

If marketplace not available, install locally:
```bash
git clone https://github.com/helius-labs/core-ai.git /tmp/core-ai
claude --plugin-dir /tmp/core-ai/helius-plugin
```

**Step 2: Configure the Helius API key**

Use the `setHeliusApiKey` tool provided by the plugin to set the existing Helius API key. The key is already stored in Supabase secrets as `RPC_URL` — extract the key portion from the URL.

**Step 3: Verify plugin works**

Test by querying the pool wallet:
```
Use the Helius plugin to check the SOL balance and token accounts of DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk
```

Expected: Returns balance data and USDC token account.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: install Helius Claude Code plugin for dev tooling"
```

---

## Task 2: Switch Client RPC to Helius

**Files:**
- Modify: `config/env.ts:12-19`

**Step 1: Update RPC URL config**

In `config/env.ts`, replace the public mainnet RPC with the Helius endpoint:

```typescript
// Helius RPC — faster reads, no rate limiting.
// Key is in the URL for hackathon. Post-hackathon: proxy through edge function.
export const HELIUS_API_KEY = 'YOUR_HELIUS_API_KEY_HERE';

const RPC_URLS: Record<SolanaCluster, string> = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
};
```

Replace `YOUR_HELIUS_API_KEY_HERE` with the actual key from Supabase secrets. Derrick will provide this.

**Step 2: Verify the app still builds**

Run:
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

Expected: Bundle succeeds with no errors.

**Step 3: Verify RPC connectivity**

Run the app on device/emulator. Connect wallet. Verify the Glimpses feed loads donation data. The data should load noticeably faster than before.

**Step 4: Commit**

```bash
git add config/env.ts
git commit -m "feat: switch client RPC to Helius for faster reads"
```

---

## Task 3: Helius Enhanced Transaction Service

**Files:**
- Create: `services/helius.ts`
- Test: `__tests__/services/helius.test.ts`

**Step 1: Write the test**

```typescript
// __tests__/services/helius.test.ts
import {parseEnhancedTransaction, type EnhancedDonation} from '../../services/helius';

describe('parseEnhancedTransaction', () => {
  it('extracts donation data from enhanced transaction', () => {
    const enhanced = {
      signature: 'abc123',
      timestamp: 1709000000,
      type: 'TRANSFER',
      source: 'SYSTEM_PROGRAM',
      nativeTransfers: [],
      tokenTransfers: [
        {
          fromUserAccount: 'DonorWallet111',
          toUserAccount: 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk',
          mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          tokenAmount: 5.0,
          tokenStandard: 'Fungible',
        },
      ],
      events: {},
    };

    const result = parseEnhancedTransaction(enhanced);
    expect(result).not.toBeNull();
    expect(result!.signature).toBe('abc123');
    expect(result!.amountUSDC).toBe(5.0);
    expect(result!.donorWallet).toBe('DonorWallet111');
    expect(result!.verified).toBe(true);
    expect(result!.timestamp).toBe(1709000000);
  });

  it('returns null for non-USDC transfers', () => {
    const enhanced = {
      signature: 'abc123',
      timestamp: 1709000000,
      type: 'TRANSFER',
      source: 'SYSTEM_PROGRAM',
      nativeTransfers: [],
      tokenTransfers: [
        {
          fromUserAccount: 'DonorWallet111',
          toUserAccount: 'SomeOtherWallet',
          mint: 'NotUSDC',
          tokenAmount: 5.0,
          tokenStandard: 'Fungible',
        },
      ],
      events: {},
    };

    const result = parseEnhancedTransaction(enhanced);
    expect(result).toBeNull();
  });
});
```

**Step 2: Run the test to verify it fails**

Run:
```bash
npx jest __tests__/services/helius.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../../services/helius'`

**Step 3: Write the service**

```typescript
// services/helius.ts
// Helius Enhanced Transactions API client
//
// Used to fetch verified on-chain transaction data for the donation feed.
// This is a READ-ONLY service — it never modifies state.

import {HELIUS_API_KEY} from '../config/env';

const HELIUS_API_BASE = 'https://api.helius.xyz/v0';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const POOL_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';

export interface EnhancedDonation {
  signature: string;
  amountUSDC: number;
  donorWallet: string;
  timestamp: number;
  verified: boolean;
}

/**
 * Parse a Helius enhanced transaction into a verified donation record.
 * Returns null if the transaction is not a valid Glimpse USDC donation.
 */
export function parseEnhancedTransaction(tx: any): EnhancedDonation | null {
  const tokenTransfers: any[] = tx?.tokenTransfers || [];

  // Find USDC transfer to the pool wallet
  const usdcTransfer = tokenTransfers.find(
    (t: any) =>
      t.mint === USDC_MINT &&
      t.toUserAccount === POOL_WALLET &&
      t.tokenAmount > 0,
  );

  if (!usdcTransfer) {
    return null;
  }

  return {
    signature: tx.signature,
    amountUSDC: usdcTransfer.tokenAmount,
    donorWallet: usdcTransfer.fromUserAccount,
    timestamp: tx.timestamp,
    verified: true,
  };
}

/**
 * Fetch enhanced transaction data from Helius for a batch of signatures.
 * Returns a map of signature -> EnhancedDonation for valid Glimpse donations.
 */
export async function fetchEnhancedTransactions(
  signatures: string[],
): Promise<Map<string, EnhancedDonation>> {
  const result = new Map<string, EnhancedDonation>();

  if (signatures.length === 0) {
    return result;
  }

  // Helius parseTransactions endpoint — batch up to 100
  const batches: string[][] = [];
  for (let i = 0; i < signatures.length; i += 100) {
    batches.push(signatures.slice(i, i + 100));
  }

  for (const batch of batches) {
    try {
      const response = await fetch(
        `${HELIUS_API_BASE}/transactions/?api-key=${HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({transactions: batch}),
        },
      );

      if (!response.ok) {
        console.warn(
          `[helius] Enhanced tx fetch failed: ${response.status}`,
        );
        continue;
      }

      const enhanced: any[] = await response.json();
      for (const tx of enhanced) {
        const donation = parseEnhancedTransaction(tx);
        if (donation) {
          result.set(donation.signature, donation);
        }
      }
    } catch (error) {
      console.warn('[helius] Enhanced tx fetch error:', error);
      // Non-fatal — feed still works from Supabase data alone
    }
  }

  return result;
}
```

**Step 4: Run the test to verify it passes**

Run:
```bash
npx jest __tests__/services/helius.test.ts --no-coverage
```

Expected: PASS

**Step 5: Commit**

```bash
git add services/helius.ts __tests__/services/helius.test.ts
git commit -m "feat: add Helius enhanced transaction service"
```

---

## Task 4: Enhanced Donation Feed UI

**Files:**
- Modify: `screens/CampaignsScreen.tsx`
- Reference: `theme/Theme.tsx`, `ui/SurfaceCard.tsx`, `services/helius.ts`, `services/chat.ts`

**Step 1: Add enhanced data fetching to CampaignsScreen**

At the top of `screens/CampaignsScreen.tsx`, add the import:

```typescript
import {fetchEnhancedTransactions, type EnhancedDonation} from '../services/helius';
```

Add state for enhanced data inside `CampaignsScreen()`, after the existing state declarations (around line 48):

```typescript
// Enhanced on-chain verification data (Helius)
const [enhancedData, setEnhancedData] = useState<Map<string, EnhancedDonation>>(new Map());
```

**Step 2: Fetch enhanced data after donations load**

Add a new `useEffect` after the existing feed fetch effect (after line 93). This runs when `feedDonations` changes and fetches enhanced data for all donation signatures:

```typescript
// Fetch enhanced on-chain data for feed donations
useEffect(() => {
  const signatures = feedDonations
    .map(d => d.tx_signature)
    .filter(Boolean);

  if (signatures.length === 0) {
    return;
  }

  let cancelled = false;
  fetchEnhancedTransactions(signatures)
    .then(data => {
      if (!cancelled) {
        setEnhancedData(data);
      }
    })
    .catch(() => {
      // Non-fatal — feed works without enhanced data
    });

  return () => {
    cancelled = true;
  };
}, [feedDonations]);
```

**Step 3: Pass enhanced data to the render function**

Update the `renderDonationList` call for the feed tab (around line 216) to pass enhanced data:

```typescript
renderDonationList({
  requiresWallet: false,
  walletConnected: !!walletAddress,
  loading: feedLoading,
  error: feedError,
  rows: feedDonations,
  navigation,
  theme,
  emptyText: 'No donations yet. Be the first to give a glimpse.',
  showDonorWallet: true,
  enhancedData,
})
```

Also pass it for `my_glimpses` tab:

```typescript
renderDonationList({
  requiresWallet: true,
  walletConnected: !!walletAddress,
  loading: historyLoading,
  error: historyError,
  rows: donationHistory,
  navigation,
  theme,
  emptyText: 'No donations recorded for this wallet yet.',
  showDonorWallet: false,
  onConnect: connect,
  enhancedData,
})
```

**Step 4: Update the renderDonationList function signature and donation card**

Add `enhancedData` to the function props:

```typescript
enhancedData?: Map<string, EnhancedDonation>;
```

Import `EnhancedDonation` at the top:

```typescript
import {fetchEnhancedTransactions, type EnhancedDonation} from '../services/helius';
```

Inside the `rows.map()` callback, after `const truncatedWallet = ...` (around line 368), add:

```typescript
const enhanced = enhancedData?.get(item.tx_signature);
const isVerified = enhanced?.verified === true;
```

**Step 5: Add the verified badge to the card**

Replace the existing `cardContent` (lines 369-406) with an updated version that includes the verification indicator:

```typescript
const cardContent = (
  <>
    <View style={styles.historyTopRow}>
      <Text
        style={[
          styles.historyAmount,
          {color: theme.colors.textPrimary},
        ]}>
        ${item.amount_usdc.toFixed(2)} USDC
      </Text>
      <View style={styles.statusRow}>
        {isVerified && (
          <View
            style={[
              styles.verifiedBadge,
              {backgroundColor: theme.colors.teal + '18'},
            ]}>
            <Text
              style={[
                styles.verifiedText,
                {
                  color: theme.colors.teal,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              VERIFIED
            </Text>
          </View>
        )}
        <Text
          style={[
            styles.historyStatus,
            {color: statusColor, fontFamily: theme.typography.brand},
          ]}>
          {statusLabel}
        </Text>
      </View>
    </View>
    {showDonorWallet && truncatedWallet ? (
      <Text
        style={[
          styles.historyMeta,
          {color: theme.colors.textSecondary},
        ]}>
        {truncatedWallet} - {recipient}
      </Text>
    ) : (
      <Text
        style={[
          styles.historyMeta,
          {color: theme.colors.textSecondary},
        ]}>
        {recipient} -{' '}
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    )}
  </>
);
```

**Step 6: Add new styles**

Add these styles to the `StyleSheet.create()` at the bottom of the file:

```typescript
statusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
verifiedBadge: {
  paddingHorizontal: 6,
  paddingVertical: 2,
  borderRadius: 3,
},
verifiedText: {
  fontSize: 8,
  lineHeight: 11,
  letterSpacing: 0.8,
  fontWeight: '700',
},
```

**Step 7: Verify the build**

Run:
```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

Expected: Bundle succeeds.

**Step 8: Commit**

```bash
git add screens/CampaignsScreen.tsx
git commit -m "feat: enhanced donation feed with on-chain verification badges"
```

---

## Task 5: Helius Webhook Edge Function

**Files:**
- Create: `supabase/functions/helius-webhook/index.ts`
- Reference: `supabase/functions/record-donation/index.ts` (pattern source)

**Step 1: Create the edge function**

```typescript
// supabase/functions/helius-webhook/index.ts
//
// Receives Helius webhook POSTs when USDC arrives at the Glimpse pool wallet.
// Parses enhanced transaction data, finds Glimpse memo, and auto-records the
// donation in Supabase. Idempotent on tx_signature — safe for duplicate POSTs.
//
// This is the server-side counterpart to the client-side record-donation flow.
// Both paths can record the same donation — the first one wins (upsert).

import {serve} from 'https://deno.land/std@0.177.0/http/server.ts';
import {createClient} from 'https://esm.sh/@supabase/supabase-js@2.48.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const WEBHOOK_AUTH_TOKEN = Deno.env.get('HELIUS_WEBHOOK_AUTH_TOKEN') || '';
const ADMIN_WALLET =
  Deno.env.get('ADMIN_WALLET') ||
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
const MATCHING_POOL_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return json({ok: true}, 200);
  }

  if (req.method !== 'POST') {
    return json({error: 'Method not allowed'}, 405);
  }

  // Validate webhook auth token (Helius sends this in Authorization header)
  if (WEBHOOK_AUTH_TOKEN) {
    const authHeader = req.headers.get('authorization') || '';
    if (authHeader !== WEBHOOK_AUTH_TOKEN && authHeader !== `Bearer ${WEBHOOK_AUTH_TOKEN}`) {
      console.warn('[helius-webhook] Invalid auth token');
      return json({error: 'Unauthorized'}, 401);
    }
  }

  try {
    const body = await req.json();

    // Helius sends an array of enhanced transactions
    const transactions: any[] = Array.isArray(body) ? body : [body];

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });

    let processed = 0;
    let skipped = 0;

    for (const tx of transactions) {
      try {
        const result = await processTransaction(supabase, tx);
        if (result === 'processed') {
          processed++;
        } else {
          skipped++;
        }
      } catch (txError) {
        console.error(
          `[helius-webhook] Error processing tx ${tx?.signature}:`,
          txError,
        );
        skipped++;
      }
    }

    console.log(
      `[helius-webhook] Batch complete: ${processed} processed, ${skipped} skipped`,
    );

    return json({processed, skipped}, 200);
  } catch (error) {
    console.error('[helius-webhook] Error:', error);
    return json({error: 'Internal error'}, 500);
  }
});

async function processTransaction(
  supabase: ReturnType<typeof createClient>,
  tx: any,
): Promise<'processed' | 'skipped'> {
  const signature = tx?.signature;
  if (!signature) {
    return 'skipped';
  }

  // Find USDC transfer to pool wallet
  const tokenTransfers: any[] = tx?.tokenTransfers || [];
  const usdcTransfer = tokenTransfers.find(
    (t: any) =>
      t.mint === USDC_MINT &&
      t.toUserAccount === MATCHING_POOL_WALLET &&
      t.tokenAmount > 0,
  );

  if (!usdcTransfer) {
    return 'skipped'; // Not a USDC transfer to our pool
  }

  const donorWallet = usdcTransfer.fromUserAccount;
  const amountUSDC = usdcTransfer.tokenAmount;

  if (!donorWallet || !amountUSDC) {
    return 'skipped';
  }

  // Parse the Glimpse memo from the transaction
  const memo = extractGlimpseMemo(tx);
  if (!memo) {
    return 'skipped'; // Not a Glimpse transaction
  }

  // Check if donation already recorded (idempotent)
  const {data: existing} = await supabase
    .from('donations')
    .select('id')
    .eq('tx_signature', signature)
    .maybeSingle();

  if (existing) {
    return 'skipped'; // Already recorded by client
  }

  // Determine campaign from cause preferences (if present in memo)
  // Webhook may not have cause_preferences — use default
  const cadence = memo.c === 'daily' ? 'daily' : 'one_time';

  // Insert donation
  const {data: donation, error: donationError} = await supabase
    .from('donations')
    .insert({
      tx_signature: signature,
      donor_wallet: donorWallet,
      recipient_wallet: MATCHING_POOL_WALLET,
      recipient_id: 'public-schools', // Default — client recording has the actual campaign
      amount_usdc: amountUSDC,
      cadence,
      donation_mode: 'solo',
      cause_preferences: ['education', 'public-schools'], // Default
      status: 'confirmed',
    })
    .select('id')
    .single();

  if (donationError) {
    // Unique constraint violation = already recorded (race condition with client)
    if (donationError.code === '23505') {
      return 'skipped';
    }
    throw donationError;
  }

  // Create conversation + welcome message
  const {data: conversation, error: convError} = await supabase
    .from('conversations')
    .insert({
      donation_id: donation.id,
      donor_wallet: donorWallet,
      admin_wallet: ADMIN_WALLET,
    })
    .select('id')
    .single();

  if (convError) {
    console.warn('[helius-webhook] Conversation insert failed:', convError);
    return 'processed'; // Donation recorded, conversation can be created later
  }

  // Welcome message
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    sender_wallet: ADMIN_WALLET,
    body: `Your donation of ${amountUSDC} USDC is confirmed on-chain. We'll follow up in this thread with updates as your donation is put to work. Thank you for giving.`,
  });

  console.log(
    `[helius-webhook] Recorded donation: ${signature} — ${amountUSDC} USDC from ${donorWallet.slice(0, 8)}`,
  );

  return 'processed';
}

/**
 * Extract Glimpse memo from enhanced transaction data.
 * Helius parses instructions including memo program data.
 */
function extractGlimpseMemo(tx: any): any | null {
  // Method 1: Check Helius's parsed instructions
  const instructions: any[] = tx?.instructions || [];
  for (const ix of instructions) {
    // Helius may surface memo as program data
    if (
      ix?.programId === MEMO_PROGRAM_ID ||
      ix?.program === 'spl-memo' ||
      ix?.program === 'memo'
    ) {
      const data = ix?.data || ix?.parsed;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.app === 'glimpse' && parsed?.tok === 'usdc') {
            return parsed;
          }
        } catch {
          // Not JSON memo, skip
        }
      }
    }
  }

  // Method 2: Check the events/memo field (Helius sometimes surfaces memos here)
  const memoEvent = tx?.events?.memo;
  if (typeof memoEvent === 'string') {
    try {
      const parsed = JSON.parse(memoEvent);
      if (parsed?.app === 'glimpse' && parsed?.tok === 'usdc') {
        return parsed;
      }
    } catch {
      // Not JSON, skip
    }
  }

  // Method 3: Check accountData for memo program
  const accountData: any[] = tx?.accountData || [];
  for (const account of accountData) {
    if (account?.program === 'spl-memo') {
      const data = account?.data;
      if (typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.app === 'glimpse' && parsed?.tok === 'usdc') {
            return parsed;
          }
        } catch {
          // Not JSON, skip
        }
      }
    }
  }

  return null;
}

function json(payload: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {...corsHeaders, 'Content-Type': 'application/json'},
  });
}
```

**Step 2: Commit the edge function**

```bash
git add supabase/functions/helius-webhook/index.ts
git commit -m "feat: add Helius webhook edge function for auto donation recording"
```

---

## Task 6: Configure Helius Webhook

**Files:** None (external configuration)

**Step 1: Generate a webhook auth token**

Run:
```bash
openssl rand -hex 32
```

Save this value. This becomes `HELIUS_WEBHOOK_AUTH_TOKEN`.

**Step 2: Set the Supabase secret**

Run:
```bash
npx supabase secrets set HELIUS_WEBHOOK_AUTH_TOKEN=<the-token-from-step-1>
```

**Step 3: Deploy the edge function**

Run:
```bash
npx supabase functions deploy helius-webhook
```

Expected: Function deploys successfully.

**Step 4: Create the webhook on Helius**

Using the Helius Dashboard (https://dashboard.helius.dev) or the Helius plugin tool:

- **Webhook URL:** `https://knvagydrbbvuumabmxcg.supabase.co/functions/v1/helius-webhook`
- **Transaction Type:** Enhanced
- **Account Addresses:** `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk` (pool wallet)
- **Auth Header:** The token from step 1
- **Network:** Mainnet

Alternatively, if the Helius plugin provides a webhook creation tool, use that:
```
Create a Helius webhook monitoring DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk for enhanced transactions, sending to https://knvagydrbbvuumabmxcg.supabase.co/functions/v1/helius-webhook with auth token <token>
```

**Step 5: Verify the webhook is registered**

Check the Helius dashboard or use the plugin to list active webhooks. Confirm the pool wallet webhook is listed and active.

---

## Task 7: End-to-End Testing

**Files:** None (manual testing)

**Step 1: Test enhanced feed**

1. Open the app on device
2. Connect wallet
3. Navigate to Glimpses tab (Feed view)
4. Verify donation cards show "VERIFIED" badge in teal
5. Verify amounts match between Supabase data and on-chain data
6. Tap "View on Explorer" — verify it opens the correct transaction

**Step 2: Test webhook auto-recording**

1. Open the app on device
2. Connect wallet
3. Make a small USDC donation (e.g., $25)
4. IMMEDIATELY close the app after the MWA wallet confirms
5. Wait 10-15 seconds (Helius webhook delivery time)
6. Reopen the app
7. Navigate to Glimpses tab → My Glimpses
8. Verify the donation appears (recorded by webhook, not client)
9. Navigate to Messages tab
10. Verify a conversation with welcome message exists

**Step 3: Test idempotency**

1. Make a donation normally (let the app complete the full flow)
2. Verify the donation appears once in the feed (not duplicated)
3. Check Supabase dashboard — donation should have exactly one row

**Step 4: Test fallback**

1. Temporarily break the webhook (change auth token in Supabase secret)
2. Make a donation
3. Verify the client-side recording still works
4. Restore the correct auth token

---

## Task 8: Quality Gates + Final Verification

**Files:** None

**Step 1: Run lint**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0
```

Expected: PASS with 0 warnings.

**Step 2: Run type check**

```bash
npx tsc --noEmit
```

Expected: PASS with no errors.

**Step 3: Run tests**

```bash
npm test -- --watchAll=false
```

Expected: All tests pass including new `helius.test.ts`.

**Step 4: Bundle check**

```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

Expected: Bundle succeeds.

**Step 5: Build release APK**

```bash
cd android && ./gradlew assembleRelease
```

Expected: Release APK builds successfully.
