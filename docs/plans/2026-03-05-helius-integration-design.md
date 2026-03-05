# Helius Integration Design

**Date:** 2026-03-05
**Goal:** Integrate the Helius Claude Code plugin (dev tools) and Helius APIs (app features) to make Glimpse exceptional for the Monolith hackathon submission (Sunday 2026-03-09, 7 PM).

**Design north star:** Make an incredibly complex solution feel simple, fun, and beautiful.

---

## What This Is

Two layers of integration:

1. **Dev-time tool** — The Helius Claude Code plugin (MCP server) gives Claude 60+ Solana tools: query wallets, parse transactions, set up webhooks, verify on-chain state. Installed once, used every session.

2. **App-level integration** — Helius APIs built into Glimpse itself: faster RPC, enhanced transaction display, automatic webhook-based donation recording. These ship in the app.

---

## Pre-Hackathon (by Saturday 2026-03-08)

### 1. Install Helius Claude Code Plugin

**Time:** 15 min
**Risk:** None (dev tool only)

Install the plugin so Claude gets direct blockchain query tools during development sessions. Enables real-time verification of mainnet state, transaction debugging, and webhook setup without CLI intermediaries.

```
/plugin marketplace add helius-labs/core-ai
```

Configure with existing Helius API key (already in Supabase secrets as `RPC_URL`).

### 2. Switch Client RPC to Helius

**Time:** 30 min
**Risk:** Low (config change)
**Trade-off:** Helius API key will be in the APK. Accepted for hackathon. Build edge proxy post-hackathon.

Change `config/env.ts` to use Helius RPC endpoint instead of `api.mainnet-beta.solana.com`.

**Why it matters for the demo:**
- Faster transaction confirmations (Helius nodes are optimized)
- No 429 rate-limit errors during live demo
- More reliable reads when loading donation data

**What changes:**
- `config/env.ts` — update `RPC_URLS['mainnet-beta']` to Helius endpoint
- Add `HELIUS_API_KEY` constant (or inline in URL)

### 3. Enhanced Donation Feed

**Time:** 3-4 hours
**Risk:** Low (read-only, additive)
**Skills:** interface-design, interaction-design, solana-dev

Build a richer donation feed using Helius Enhanced Transactions API. Currently the Glimpses tab shows donation data from Supabase only. Enhanced version shows verified on-chain data alongside it.

**What the user sees:**
- Each donation card shows on-chain verification status
- Transaction details pulled from the chain (not just the database)
- Verified badge indicating the on-chain receipt matches the recorded amount
- Explorer link for anyone who wants to verify themselves

**Technical approach:**
- New service: `services/helius.ts` — Helius API client (Enhanced Transactions endpoint)
- Modify `screens/CampaignsScreen.tsx` — fetch enhanced data for each donation
- New component: verified transaction card following brand guide (glass card, Cormorant Garamond amounts, Courier Prime labels)

**Design direction:**
- Glass card with subtle on-chain verification indicator
- Amount displayed in Cormorant Garamond Light (36px)
- "Verified on Solana" label in Courier Prime (10px, uppercase, teal accent)
- Staggered fade-up entrance animation per brand guide specs
- The complexity of on-chain verification should feel effortless — one glance tells you it's real

**Data flow:**
```
CampaignsScreen
  -> fetchAllDonations() (existing, Supabase)
  -> fetchEnhancedTransactions(txSignatures) (new, Helius API)
  -> merge: Supabase record + on-chain verification
  -> render enhanced donation cards
```

### 4. Helius Webhook for Automatic Donation Recording

**Time:** 4-5 hours
**Risk:** Medium (new edge function, but additive — existing client-side recording still works as fallback)
**Skills:** solana-dev

Replace the client-side orphan retry pattern with server-side automatic detection. When USDC arrives at the pool wallet with a Glimpse memo, Helius detects it and POSTs to a new Supabase edge function. Donations are recorded even if the user closes the app.

**Why it matters for the demo:**
- "Close the app after donating. Reopen it. Your donation is already there." — this is a wow moment.
- Eliminates the orphan problem entirely (TODOS #2)
- Shows judges the backend is production-grade, not demo-ware

**What changes:**

New edge function: `supabase/functions/helius-webhook/index.ts`
- Receives Helius webhook POST
- Validates webhook auth token
- Parses enhanced transaction data
- Finds Glimpse memo (`app: "glimpse"`, `tok: "usdc"`)
- Extracts donor wallet, amount, cadence from memo
- Upserts donation record (idempotent on `tx_signature`)
- Creates conversation + welcome message if new

Helius webhook configuration:
- Webhook type: Enhanced Transaction
- Account: pool wallet `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk`
- Filter: SPL token transfers to the pool ATA
- Target URL: `https://knvagydrbbvuumabmxcg.supabase.co/functions/v1/helius-webhook`

**Idempotency:** The webhook may fire for transactions already recorded by the client. The edge function uses `tx_signature` as a unique key — duplicate POSTs are no-ops.

**Fallback:** Existing client-side `record-donation` flow remains unchanged. The webhook is an additional recording path, not a replacement. Belt and suspenders.

**Data flow:**
```
On-chain USDC transfer to pool wallet
  -> Helius detects (webhook subscription)
  -> POST to helius-webhook edge function
  -> Parse enhanced transaction
  -> Find Glimpse memo in transaction
  -> Upsert donation (idempotent on tx_signature)
  -> Create conversation if new
```

---

## Post-Hackathon Roadmap

These features become straightforward once the Helius plugin is installed and the API patterns are established:

### Infrastructure

| Item | Helius API | Description |
|------|-----------|-------------|
| RPC edge proxy | Custom edge fn | Move Helius API key behind Supabase edge proxy. Key never ships in APK. |
| Priority fees | `getPriorityFeeEstimate` | Dynamic compute budget based on network congestion. Better tx landing rate. |
| DAS-powered SGT | DAS `getAssetsByOwner` | Replace Token-2022 parsing with single DAS call. Cleaner, faster, more reliable. |

### Product Features

| Item | Helius API | Description |
|------|-----------|-------------|
| Real-time feed | LaserStream (WebSocket) | Live-updating donation feed. Donations appear the instant they confirm. |
| $GLIMPSE analytics | DAS + Token API | Token holder queries for governance, airdrop eligibility, holder counts. |
| Donor profiles | Wallet API | Anonymized portfolio context for donor trust/social proof. |
| Admin monitoring | Webhooks + Enhanced Tx | Alerts on large donations, pool wallet inflow/outflow tracking. |
| Leaderboard data | Enhanced Transactions | Aggregate verified on-chain data for leaderboard rankings. |

---

## Execution Order

```
Thursday (2026-03-06):
  1. Install Helius plugin (15 min)
  2. Verify mainnet state with plugin tools (30 min)
  3. Switch client RPC to Helius (30 min)
  4. Build enhanced donation feed — service + UI (3-4 hours)

Friday (2026-03-07):
  5. Helius webhook edge function (4-5 hours)
  6. End-to-end testing: donate -> close app -> reopen -> verify auto-recorded (1 hour)
  7. Update pitch narrative if webhook works

Saturday (2026-03-08):
  8. Final testing + polish
  9. Demo video + submission materials
  10. Buffer time
```

**Cut rule:** If the webhook isn't working cleanly by Friday evening, ship without it. The enhanced feed + faster RPC already make the demo better. The existing client-side recording still works.

---

## Alignment Notes

- **SOUL.md:** Every integration reinforces "every dollar tracked, every impact proven." Enhanced feed shows verified chain data. Webhook ensures no donation is missed. Helius is the how, transparency is the why.
- **Brand guide:** All new UI follows glass card pattern, type scale (Cormorant Garamond amounts, Courier Prime labels), spacing tokens, animation specs (fadeUp, stagger).
- **CLAUDE.md architecture:** Helius key accepted client-side for hackathon. Edge proxy is first post-hackathon task.
- **TODOS.md:** Webhook directly ships item #2 (Backend Transaction Listener).
