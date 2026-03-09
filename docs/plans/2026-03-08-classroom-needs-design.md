# Classroom Needs + Sp3nd Auto-Buy — Design Document

**Date:** 2026-03-08
**Status:** Draft — awaiting founder review
**Author:** Claude (brainstorming session with Derrick)

---

## Concept

Teachers submit needs via a simple external form. Glimpse admin curates them into in-app listings. A donor browses, picks an item, funds the full price via USDC donation (existing MWA flow). Glimpse's server agent uses the Sp3nd API to auto-purchase the item on Amazon — Prime shipping, zero platform fee. Donor sees Amazon order confirmation + later a classroom photo from the teacher.

**Tagline fit:** "Give. See the proof. Start a conversation." — except now the proof is *an Amazon order confirmation + a photo of kids using the supplies.*

---

## Research Findings

### Sp3nd Assessment

| Factor | Finding | Risk |
|--------|---------|------|
| **What it is** | Web3 e-commerce bridge by Lab369. Live since 2024. 1-10 employees. | Small company — dependency risk |
| **Status** | Currently in beta. Consumer app + agent API. | Beta = expect rough edges |
| **Fee** | $2/tx consumer, 0% agent API (confirmed in GitHub skill) | Agent API fee structure may change |
| **Shipping** | Free Prime shipping (Sp3nd maintains Prime accounts) | 22 Amazon marketplaces, 200+ countries |
| **KYC** | None required for agents or buyers | Good for privacy |
| **Reviews** | 4.8/5 (150 reviews on site), 4.3/5 (4 reviews on Soladex) | Limited independent validation |
| **Refund policy** | Not publicly documented | **HIGH RISK** — if Amazon order fails after USDC payment, unclear what happens |
| **Planned** | Temu integration, Solana Seeker mobile app | Seeker app = potential competitor/partner |

### x402 Protocol Assessment

| Factor | Finding |
|--------|---------|
| **Origin** | Coinbase + Cloudflare, launched May 2025 |
| **Adoption** | 100M+ payments processed. Backed by Coinbase, Circle, Stripe, AWS |
| **Solana share** | 50-80% of all x402 transactions |
| **How it works** | Server returns HTTP 402 + payment terms → client pays USDC → resubmits with proof |
| **Free tier** | Coinbase facilitator: 1,000 tx/month free |
| **Maturity** | x402 V2 launched. Real standard, not a hack |

**Verdict:** x402 is legitimate infrastructure backed by major players. Sp3nd is a small but real company building on it.

### Edge Function Feasibility

| Question | Answer | Confidence |
|----------|--------|------------|
| @solana/web3.js v1 in Deno? | YES via esm.sh | High — existing edge functions prove pattern |
| @solana/spl-token in Deno? | YES via esm.sh | High — pure instruction builders |
| Full Sp3nd x402 flow in Deno? | YES — HTTP + tx construction + ed25519 signing | High |
| Fits in 60s timeout? | YES — happy path ~5-25s, worst case ~40s | Medium-High |
| Need Node.js alternative? | NO — Supabase edge functions are sufficient | High |

**Key requirement:** Server-side Solana keypair stored as Supabase secret. Must hold USDC balance for purchases.

### Helius Integration Points

The existing Helius webhook already detects USDC transfers to the Glimpse pool wallet. The webhook payload includes `tokenTransfers` with mint, amount, and the memo's `cn` (classroom need ID) field. This can trigger the Sp3nd purchase flow.

**Two trigger options:**
1. **From `record-donation`** — after recording, call Sp3nd inline (risk: 60s timeout pressure)
2. **From webhook** — Helius fires, edge function processes, triggers separate `trigger-purchase` function (recommended: decoupled, resilient)

---

## Three Approaches

### Approach A: Full Auto-Buy (Recommended)

```
Donor funds item → record-donation inserts purchase_orders row →
trigger-purchase edge function calls Sp3nd API → auto-buys on Amazon →
updates status → donor sees proof
```

**Pros:** Fully automated. Best hackathon demo. "Donor taps fund, item shows up at school."
**Cons:** Most complex. Sp3nd failure = stuck order. Agent wallet needs USDC.
**Build time:** ~6-8 hours

### Approach B: Admin-Triggered Purchase

```
Donor funds item → donation recorded → admin sees "Ready to Purchase" in Supabase →
admin triggers purchase via CLI/curl → Sp3nd buys → status updates
```

**Pros:** Lower risk. You control when purchases happen. Simpler edge function.
**Cons:** Not fully automated. Manual step in the loop. Less impressive demo.
**Build time:** ~4-5 hours

### Approach C: Sp3nd as Demo + Manual Fulfillment

```
Donor funds item → donation recorded → you manually use Sp3nd consumer app to buy →
you upload Amazon confirmation screenshot as proof → teacher gets item
```

**Pros:** Simplest. No server-side Sp3nd integration. Just listings + donations.
**Cons:** No automation. Not a differentiator. You're just a DonorsChoose clone with USDC.
**Build time:** ~2-3 hours (listings UI + donation tagging only)

### Recommendation: Approach A with Approach B as fallback

Build Approach A. If the `trigger-purchase` edge function proves too complex in the time available, fall back to Approach B (admin trigger). The database schema and UI are identical — the only difference is whether the purchase is auto-triggered or manually triggered.

---

## Blindspots & Risks

### 1. Refund Gap (HIGH)
**What:** If USDC payment to Sp3nd succeeds but Amazon rejects the order (out of stock, invalid address, fraud flag), there is no documented refund path.
**Mitigation:** Start with low-cost items ($10-50). Keep agent wallet balance small. Test with a real purchase before the demo. Contact Sp3nd team directly (Discord) to ask about failure handling.

### 2. Agent Wallet Security (HIGH)
**What:** Server-side keypair with USDC. If Supabase secrets are compromised, funds are lost.
**Mitigation:** Keep minimal balance (just enough for 2-3 purchases). Use a dedicated wallet, not the main Glimpse pool. Fund it manually before demos.

### 3. Price Drift (MEDIUM)
**What:** Amazon prices change. Teacher lists item at $29.99, by the time donor funds it, price is $34.99.
**Mitigation:** Store price at listing time. If Sp3nd cart creation shows a higher price, flag for admin review. For hackathon: just ensure listing price matches when you add it.

### 4. Sp3nd API Downtime (MEDIUM)
**What:** If Sp3nd is down during the demo, auto-buy fails.
**Mitigation:** Build status handling so "pending purchase" is a valid state. Demo can show "purchase initiated" even if Sp3nd is momentarily slow. Have a pre-completed order to show the full proof loop.

### 5. Shipping Address Privacy (MEDIUM)
**What:** School shipping addresses are PII. Stored in Supabase `classroom_needs` table.
**Mitigation:** Shipping address stored admin-only (service_role access). Not exposed to donors via RLS. Only the `trigger-purchase` edge function reads it.

### 6. Cart Expiration (LOW)
**What:** Sp3nd carts expire in 30 minutes. If there's a delay between donation confirmation and cart creation, the timing might be tight.
**Mitigation:** Create cart + order + pay in a single edge function invocation. The 60s timeout is sufficient.

### 7. Supabase Cold Starts (LOW)
**What:** First invocation of `trigger-purchase` may have 1-3s cold start loading Solana packages from esm.sh.
**Mitigation:** Warm up the function before demos. Not a real issue for production.

---

## Architecture (Approach A)

### New Supabase Tables

```sql
-- Migration 018
CREATE TABLE classroom_needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  amazon_url TEXT NOT NULL,
  asin TEXT,
  image_url TEXT,
  price_usdc NUMERIC(10,2) NOT NULL CHECK (price_usdc > 0),
  teacher_first_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  school_city TEXT,
  school_state TEXT,
  shipping_address JSONB, -- admin-only, not exposed via RLS
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','funded','purchasing','ordered','shipped','delivered','failed')),
  funded_by_wallet TEXT,
  funded_by_donation_id UUID REFERENCES donations(id),
  donor_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_need_id UUID NOT NULL REFERENCES classroom_needs(id),
  donation_id UUID NOT NULL REFERENCES donations(id),
  sp3nd_cart_id TEXT,
  sp3nd_order_id TEXT,
  sp3nd_order_number TEXT,
  amount_usdc NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cart_created','order_created','payment_sent','paid','ordered','shipped','delivered','failed')),
  error_message TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add classroom_need_id to donations
ALTER TABLE donations ADD COLUMN classroom_need_id UUID REFERENCES classroom_needs(id);
```

### RLS Rules
- `classroom_needs`: Public read on `status = 'open'`, authenticated read on funded (donor sees their items), service_role write
- `purchase_orders`: Donor read on orders linked to their donations, service_role write
- `shipping_address` JSONB is never exposed — only `trigger-purchase` edge function reads it via service_role

### New Edge Function: `trigger-purchase`

```
Input: { classroomNeedId, donationId }
Auth: Internal call (service_role or webhook auth)

Flow:
1. Fetch classroom_need (get amazon_url, asin, price, shipping_address)
2. Register agent with Sp3nd (one-time, cache creds in secrets)
3. createPartnerCart({ items: [{ product_id: asin, product_url, quantity: 1, price }] })
4. createPartnerOrder({ cart_id, customer_email, shipping_address })
5. payAgentOrder() → get 402 → build USDC tx → sign with agent keypair → submit to PayAI
6. Poll getPartnerOrders for confirmation (5s intervals, max 60s)
7. Update purchase_orders status
8. Update classroom_needs status
9. Post proof message to donor's conversation thread
```

### Modified Files (All Additive)

| File | Change | Size |
|------|--------|------|
| `config/donationConfig.ts` | Add `classroom-needs` campaign | S |
| `utils/transfer.ts` | Add optional `cn` field to memo | S |
| `services/donations.ts` | Thread `classroomNeedId` parameter | S |
| `utils/retry.ts` | Add `classroomNeedId` to pending interface | S |
| `record-donation/index.ts` | Accept `classroomNeedId`, insert `purchase_orders` row | M |
| `helius-webhook/index.ts` | Detect `cn` in memo | S |
| `screens/CampaignsScreen.tsx` | Add "Needs" section with listing cards | M |
| `screens/GiveScreen.tsx` | Accept route params, pre-fill for classroom needs | M |
| `navigation/AppNavigator.tsx` | Update type params | S |

### Agent Wallet Requirements

- New Solana keypair (not the Glimpse pool wallet)
- Funded with ~$100-200 USDC for initial purchases
- Private key stored as Supabase secret: `SP3ND_AGENT_PRIVATE_KEY`
- Registered with Sp3nd API: `SP3ND_API_KEY`, `SP3ND_API_SECRET`
- Does NOT need SOL — PayAI facilitator covers tx fees

### Data Flow

```
TEACHER (external):
  Google Form → Derrick's email → manual insert into classroom_needs table

DONOR (in-app):
  Glimpses tab → "Needs" section → tap item → "Fund This" →
  GiveScreen (amount locked, campaign auto-selected) →
  MWA sign → USDC transfer → confirm → record-donation

SERVER (automated):
  record-donation → inserts purchase_orders (status: pending) →
  trigger-purchase → Sp3nd API → Amazon order → status updates →
  proof message in conversation thread

PROOF (in-app):
  Messages tab → conversation → ProofCard shows:
    1. "Order placed" + Amazon order number (immediate)
    2. "Shipped" + tracking link (when available)
    3. Classroom photo from teacher (manual upload by admin)
```

---

## Build Order (Critical Path)

1. **Generate agent wallet** + register with Sp3nd + fund with USDC (~30min)
2. **Migration 018** — classroom_needs + purchase_orders tables (~30min)
3. **trigger-purchase edge function** — the hardest piece (~2-3hr)
4. **Modify record-donation** — accept classroomNeedId, insert purchase_orders (~1hr)
5. **Listings UI** — CampaignsScreen "Needs" section (~1-2hr)
6. **GiveScreen modifications** — pre-fill from classroom need (~1hr)
7. **Memo + donation plumbing** — transfer.ts, donations.ts, retry.ts (~30min)
8. **Seed test data** — create 2-3 real classroom need listings (~30min)
9. **End-to-end test** — fund a real item, verify Amazon purchase (~30min)

**Estimated total: 7-10 hours**

---

## What Makes This a Hackathon Winner

1. **Real-world impact** — not a demo, actually buys supplies for teachers
2. **Full on-chain proof loop** — USDC donation → Amazon order → classroom photo
3. **x402 integration** — cutting-edge Coinbase-backed payment protocol
4. **Sp3nd + Solana + Seeker** — mobile-first, stablecoin-native commerce
5. **Zero fees** — 0% Glimpse fee + 0% Sp3nd agent fee + Prime shipping
6. **Global** — works with 22 Amazon marketplaces, 200+ countries
7. **The story** — "A teacher in Iowa needs $30 in markers. A stranger in Tokyo sees it on their Seeker, taps 'Fund This', and markers arrive at the school in 2 days. With on-chain proof."
