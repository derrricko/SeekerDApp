# Helius Full Integration Map

**Date:** 2026-03-05
**Purpose:** Comprehensive audit of all 62 Helius MCP tools mapped to Glimpse use cases.
**Current Helius plan:** Free tier
**Current integrations:** Helius RPC, Enhanced Transactions API, Enhanced Webhook

---

## What Glimpse Already Uses (3 of 62 tools)

| Tool | Location | Status |
|------|----------|--------|
| Helius RPC (mainnet) | `config/env.ts` | Live |
| `parseTransactions` (Enhanced Tx API) | `services/helius.ts` | Live |
| Enhanced Webhook | `supabase/functions/helius-webhook/index.ts` | Live |

---

## Tier 1 — High Impact, Ship Soon

### Priority Fees + Sender API

**Tools:** `getPriorityFeeEstimate`, Sender `/fast` endpoint
**Free tier:** Yes (0 credits for Sender, 1 credit for priority fee)
**Effort:** 4-6 hours

Dynamic compute budget for donation transactions. During network congestion, donations fail silently. Priority fees add ~$0.001 to guarantee next-slot inclusion. Sender API dual-routes through validators + Jito for maximum landing probability.

**Open question:** Glimpse advertises "zero fees." Priority fees ($0.001) and Sender tips ($0.03 SOL) are network costs not platform revenue, but the perception matters. Options:
1. Glimpse PBC absorbs these costs from business revenue
2. Frame as "network gas" separate from platform fees
3. Skip until revenue supports subsidizing

**Changes:** `utils/transfer.ts` — add ComputeBudgetProgram.setComputeUnitPrice + tip instruction

### Real-Time Live Feed

**Tools:** `transactionSubscribe`, `accountSubscribe`, `getEnhancedWebSocketInfo`
**Free tier:** NO — requires Business plan ($499/mo)

Enhanced WebSocket subscription on pool wallet. Donations appear instantly in the Glimpses feed.

**Current alternative:** Helius webhook -> Supabase Realtime already provides near-real-time (seconds). The marginal improvement (seconds -> instant) doesn't justify $499/mo at current scale.

**Revisit when:** Revenue supports Business plan, or donor volume makes real-time feed a differentiator.

### Wallet Identity Layer

**Tools:** `getWalletIdentity`, `batchWalletIdentity`, `getWalletBalances`, `getWalletHistory`, `getWalletTransfers`, `getWalletFundedBy`
**Free tier:** Yes but credit-intensive (100 credits/call)
**Effort:** 6-8 hours

Enrich every donation with donor context: KOL? exchange? DAO? personal wallet? 5,100+ tagged accounts across 40+ categories.

**Pros:** Makes feed dramatically more interesting. `getWalletFundedBy` is unique — sybil detection + compliance.
**Cons:** Most wallets return 404 (only notable wallets tagged). 100 credits/call burns free tier fast. Privacy tension with anonymous donors.

**Best timing:** Post-launch when donor volume makes enrichment meaningful.

### Transaction History

**Tools:** `getTransactionHistory`
**Free tier:** Yes
**Effort:** 2-3 hours

Paginated enhanced transaction history for the pool wallet. Richer than Supabase-only queries — includes parsed descriptions, token amounts, sources.

---

## Tier 2 — Medium Impact, Post-Hackathon

### DAS-Powered SGT Verification

**Tools:** `getAsset`, `getAssetsByOwner`
**Free tier:** Yes (10 credits/call)
**Effort:** 4-6 hours

Replace manual Token-2022 SGT parsing with single DAS call. Current implementation checks mint authority, metadata pointers, group mint — fragile. DAS returns all assets including SGTs natively.

**Note:** 2-3 second indexing latency. A brand-new SGT might not appear immediately after mint. Mitigate with caching or fallback to current method.

### $GLIMPSE Token Analytics

**Tools:** `getTokenHolders`, `searchAssets`, `getSignaturesForAsset`, `getTokenAccounts`
**Free tier:** Yes
**Effort:** 8-12 hours

- Holder count and top holders for governance weight
- Token transaction history (buys/sells/transfers)
- Balance-threshold queries for airdrop eligibility
- Foundation for the Rank tab

### Network Health

**Tools:** `getNetworkStatus`
**Free tier:** Yes
**Effort:** 2 hours

Show degraded-mode UI when Solana is congested. Set expectations before users attempt donations.

---

## Tier 3 — Future / Scale Features

### LaserStream gRPC

**Tools:** `laserstreamSubscribe`, `getLaserstreamInfo`
**Free tier:** No (Professional plan, $999/mo)

Ultra-low latency streaming. 40x faster than JS WebSocket clients. Multi-region failover. 24-hour historical replay. Overkill for donations but impressive at scale.

### ZK Compression

**Tools:** Full ZK Compression API (20+ methods)
**Free tier:** Yes (10-100 credits/call)

When Glimpse issues proof-of-donation tokens at scale, compression drops per-token cost from ~$0.02 to ~$0.00005. Not needed now, critical at thousands of donors.

### Webhook Management

**Tools:** `getAllWebhooks`, `getWebhookByID`, `updateWebhook`, `deleteWebhook`
**Free tier:** Yes

Admin dashboard for managing webhook configuration. Currently managed via Helius dashboard manually.

---

## Tier 4 — Dev-Only / Not Applicable (32 tools)

| Category | Tools | Reason |
|----------|-------|--------|
| Onboarding | 6 | Dev setup tools (API key, keypair, signup) |
| Transfers | 2 | Glimpse uses MWA, not server-side transfers |
| Plans & Billing | 5 | Account management |
| Solana Knowledge | 5 | Dev reference (SIMDs, source code, docs) |
| Docs & Guides | 9 | Dev reference (except `getPumpFunGuide` for $GLIMPSE) |
| Compressed NFT proofs | 3 | No compressed NFTs in current architecture |
| Info helpers | 2 | Setup helpers for WebSocket/LaserStream |

---

## Recommended Sequence

```
Now (when ready):
  1. Install Helius MCP plugin for Claude Code dev sessions

Post-hackathon hardening:
  2. DAS-powered SGT verification (replace Token-2022 parsing)
  3. Network health indicator
  4. Transaction history for richer Glimpses feed

When revenue supports it:
  5. Priority Fees + Sender (resolve zero-fee messaging first)
  6. $GLIMPSE token analytics (Rank tab)
  7. Wallet Identity enrichment

At scale:
  8. Enhanced WebSockets or LaserStream (Business+ plan)
  9. ZK Compression for proof-of-donation tokens
  10. Admin monitoring dashboard
```

---

## Zero-Fee Tension

Glimpse's brand promise: "GoFundMe takes three percent. We take zero."

Priority fees (~$0.001), Sender tips (~$0.03 SOL), and base gas (~$0.000005 SOL) are all network costs, not platform revenue. But the perception gap between "zero fee" and "you pay network gas" needs careful framing.

**Options:**
1. **Glimpse PBC absorbs all network costs** — donors truly pay zero. Requires revenue to subsidize.
2. **Frame as "zero platform fee"** — transparent that network gas exists but Glimpse takes nothing.
3. **Defer** — current base gas is negligible enough that no one notices. Add priority fees + Sender only when failed donations become a real problem.

Current recommendation: Option 3 (defer). Base gas is <$0.01. Revisit when donation failure rates warrant intervention.

---

## Helius API Quick Reference

| API | Endpoint | Credits | Free Tier Rate |
|-----|----------|---------|----------------|
| RPC | `mainnet.helius-rpc.com` | 1/call | 10 req/s |
| DAS | `mainnet.helius-rpc.com` (JSON-RPC) | 10/call | 2 req/s |
| Enhanced Tx | `api.helius.xyz/v0/transactions` | 1/call | 2 req/s |
| Wallet API | `api.helius.xyz/v1/wallet` | 100/call | 2 req/s |
| Priority Fee | `mainnet.helius-rpc.com` (JSON-RPC) | 1/call | 10 req/s |
| Webhooks | `api.helius.xyz/v0/webhooks` | 1/event | 5 webhooks max |
| Sender | `sender.helius-rpc.com/fast` | 0 | 50 req/s |
| Enhanced WS | `atlas-mainnet.helius-rpc.com` | 3/0.1MB | Business+ only |
| LaserStream | Regional gRPC endpoints | 3/0.1MB | Professional only |
| ZK Compression | `mainnet.helius-rpc.com` (JSON-RPC) | 10-100/call | 2 req/s |
