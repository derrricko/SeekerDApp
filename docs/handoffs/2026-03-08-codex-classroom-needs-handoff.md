# Codex Handoff: Classroom Needs + Sp3nd Auto-Buy

**Date:** 2026-03-08
**From:** Claude Opus 4.6 (Claude Code CLI)
**To:** Codex (OpenAI)
**Purpose:** Design the UI layout for a new "Classroom Needs" feature. After your layout design, Derrick returns to Claude Code for the full buildout, then returns to you for auditing.

---

## Workflow

```
[DONE] Claude Code — brainstorming, research, architecture, design doc
[YOU]  Codex — design the UI layout (screens, components, visual hierarchy)
[NEXT] Claude Code — full implementation (schema, edge functions, UI code, Sp3nd integration)
[NEXT] Codex — audit the implementation
```

---

## What We're Building

A new section inside the Glimpse app where **public school teachers list Amazon products their classroom needs**, and **donors fund those items with USDC**. After a donor funds an item, Glimpse's server automatically purchases it on Amazon using the **Sp3nd API** (an x402 protocol commerce bridge). The donor sees proof of purchase.

### The Full Loop

```
Teacher submits form (external) →
Admin adds listing to app →
Donor sees listing in "Needs" section →
Donor taps "Fund This" →
Existing USDC donation flow (MWA wallet on Solana Seeker) →
On-chain confirmation →
Server auto-buys item on Amazon via Sp3nd API →
Donor sees Amazon order confirmation as proof →
Teacher gets the item →
Classroom photo posted as final proof
```

---

## How We Got Here (Decision Trail)

This section documents the brainstorming conversation so you can see the reasoning behind each decision.

### 1. Starting Point
Derrick wanted a place where public school teachers can list Amazon products their class needs. He knew about **Sp3nd** (https://github.com/kent-x1/sp3nd-agent-skill) — a Helius ecosystem tool that lets you buy Amazon products with USDC on Solana, with Prime shipping and zero fees.

### 2. Who Pays?
**Decision: Donor pays directly via USDC.** Not Glimpse-funded, not crowdfunded. One donor, one item. Simple and clean.

### 3. How Does It Work Mechanically?
Sp3nd is designed for server-side AI agents with their own Solana keypairs — it signs transactions autonomously, no wallet popup. Since donors use MWA (Mobile Wallet Adapter) on the Seeker device, they can't interact with Sp3nd directly.

**Decision: Two-step flow.** Donor sends USDC to Glimpse via the existing donation flow (MWA). Then Glimpse's server-side agent wallet uses Sp3nd to buy the item on Amazon. This reuses the entire existing donation pipeline.

### 4. Teacher Experience
**Decision: Teachers don't touch the app.** They submit a simple external form (Google Form or similar) with what they need, why, and photos of their current setup. Derrick (admin) curates submissions into in-app listings manually via Supabase dashboard.

### 5. Where Do Donors See Listings?
**Decision: New section inside the existing Glimpse app.** Specifically, a "NEEDS" toggle pill on the Glimpses/Campaigns tab (alongside the existing "FEED" and "MY GLIMPSES" toggles). Not a separate app, not a new tab.

### 6. Proof of Impact
**Decision: Both immediate + follow-up proof.**
- Immediate: Amazon order confirmation (order number, shipping status)
- Follow-up: Classroom photo from teacher showing the item in use
- These appear as ProofCard components in the donor's message thread

### 7. Funding Model
**Decision: One donor, one item.** No crowdfunding, no partial contributions. A single donor covers the full cost. This keeps it simple and gives clear ownership of impact.

### 8. Messaging
**Decision: Optional note, no direct communication.** Donor can leave an optional note/message when funding, but there is no back-and-forth thread with the teacher. The teacher can optionally send a thank-you photo, but it's one-way.

### 9. Sp3nd Integration Level
**Decision: Full auto-buy (Approach A).** Server-side edge function calls Sp3nd API after donation confirmation. Not manual, not admin-triggered. Fully automated for the best hackathon demo.

**Fallback: Approach B (admin-triggered)** if auto-buy proves too complex. Same schema, same UI — only difference is whether purchase triggers automatically or via admin action.

---

## Skills Used by Claude Code

These are specialized skill files that guided the architecture and design decisions. Reference them for context on conventions and patterns:

1. **`solana-seeker-dev`** (`.claude/skills/solana-seeker-dev/SKILL.md`) — The default operating skill for ALL SeekerDApp work. Covers mainnet source-of-truth, dual recording architecture (client + webhook), RLS safety, error contracts, MWA patterns, SPL transfer patterns, Supabase edge function patterns, and Seeker device constraints. **Any code touching Solana should be checked against this skill.**

2. **`superpowers:brainstorming`** — Structured the interview process. One question at a time, multiple choice preferred, explore 2-3 approaches before settling, present design incrementally.

3. **`interface-design`** — For screen structure, spacing, hierarchy, and visual consistency. Referenced in CLAUDE.md as part of the Default Collaboration Profile.

4. **`interaction-design`** — For transitions, microinteractions, and UX polish.

5. **`12-principles-of-animation`** — For final animation quality audit.

6. **`fixing-motion-performance`** — When motion feels slow or unstable on device.

### Design System Reference
- Full design system: `docs/design/brand-guide.md`
- Typography: Courier Prime (brand/body/labels) + Cormorant Garamond Light (display/headlines)
- Theme: radius sm:6 to xl:18, subtle elevation shadows
- No forced dark mode — follows system preference, light default
- Proof-First Redesign details: `docs/plans/2026-03-05-proof-first-redesign-design.md`

---

## Existing App Context

### Current Navigation
```
Bottom Tab Bar (3 visible + 1 hidden):
├── Glimpses tab (CampaignsScreen) — campaign overview, donation feed
│   ├── Toggle: "FEED" — all donations
│   └── Toggle: "MY GLIMPSES" — user's donations
├── Give tab (GiveScreen) — campaign select, USDC amount, donate
│   └── Center "DONATE" accent pill button in tab bar
├── Messages tab (MessagesScreen) — conversation list → chat
└── Rank tab (hidden) — leaderboard placeholder
```

### Current Glimpses Tab (CampaignsScreen)
- Two-mode toggle pills at top: "FEED" and "MY GLIMPSES"
- Cards showing donation amount, status, verified badge, explorer link
- Uses `ProofCard` component (3-state: verified/pending/unavailable)
- Teal accent bar on ProofCard for verification status

### Current Give Tab (GiveScreen)
- Campaign dropdown (3 campaigns: Public Schools $25 min, Single Moms $50 min, Foster Care $100 min)
- USDC amount input with quick-select pills [5, 10, 25, 50]
- Collapsible notes field
- 3-step flow: form → confirm → processing
- Receipt moment with "View Your Thread" + "Done"

### Current Messages Tab
- Conversation list with compact ProofCard at thread header
- Supabase Realtime chat

### Component Library Already Built
- `ProofCard` — 3-state verification card with teal accent bar, compact mode available
- `SurfaceCard` — base card component
- Custom tab bar with accent pill center button, teal dot indicators, 64px height
- Toggle pill system for view modes
- Quick-select pill buttons
- G lettermark breathing animation on home

---

## What You Need to Design (Layout Only)

### 1. Classroom Needs Listing Cards

Design a card component for the "NEEDS" section. Each card represents a teacher's Amazon product request.

**Data available per listing:**
- `title` — e.g., "30 Composition Notebooks"
- `description` — why the teacher needs it
- `image_url` — product photo or classroom photo
- `price_usdc` — exact price (e.g., $29.99)
- `teacher_first_name` — e.g., "Sarah"
- `school_name` — e.g., "Lincoln Elementary"
- `school_city`, `school_state` — e.g., "Muscatine, IA"
- `status` — open (fundable), funded, ordered, shipped, delivered

**Design considerations:**
- Should feel distinct from donation feed cards but visually cohesive
- Price should be prominent — this is a concrete, fundable amount
- "Fund This" CTA should be clear and inviting
- Status indicators for items already funded/ordered/delivered
- Consider showing funded items as "proof" — not just open items

### 2. "NEEDS" Toggle on Glimpses Tab

A third toggle pill alongside "FEED" and "MY GLIMPSES". When selected, shows the classroom needs listings instead of the donation feed.

### 3. Pre-Filled Give Screen (When Funding a Need)

When donor taps "Fund This" on a listing card, they navigate to GiveScreen with:
- Campaign auto-selected (locked)
- Amount pre-filled and locked to the item price
- Product details shown (title, image, teacher name, school)
- The existing confirm → processing → receipt flow follows

**Design consideration:** The Give screen should feel slightly different when funding a specific item vs. a general donation. The donor should see *what* they're buying, not just a dollar amount.

### 4. Proof Display (Post-Purchase)

After a donor funds an item, they should see purchase progress:
- **Immediate:** "Purchase initiated" state
- **Order placed:** Amazon order number
- **Shipped:** Tracking link
- **Delivered:** Delivery confirmation
- **Impact:** Classroom photo from teacher

This could be a ProofCard variant or a new component in the Messages thread. The existing ProofCard has verified/pending/unavailable states — purchase tracking extends this with more granular states.

### 5. Optional: Donor Note Input

When funding a classroom need, the donor can optionally leave a short note (e.g., "Hope the kids enjoy these!"). This is simpler than the current notes field — just a single text input, not a collapsible section.

---

## Technical Constraints for Layout

- **Target device:** Solana Seeker — 6.36" AMOLED 120Hz, Android 14
- **Framework:** React Native 0.76.5 + TypeScript
- **Navigation:** @react-navigation/bottom-tabs
- **Styling:** StyleSheet.create (no Tailwind, no styled-components)
- **Fonts:** Courier Prime (body/labels), Cormorant Garamond Light (display/headlines)
- **Theme:** Radius sm:6 to xl:18, subtle elevation shadows
- **Colors:** Reference `docs/design/brand-guide.md` for exact palette
- **Tab bar:** Custom 64px bar with teal accent pill center button
- **Light mode default,** follows system preference

---

## Sp3nd / x402 Context (For Your Awareness)

You don't need to design for the Sp3nd integration — that's backend. But for context:

- **Sp3nd** is a real Web3 e-commerce bridge by Lab369 (live since 2024, beta). It buys Amazon products with USDC on Solana — 0% agent fee, free Prime shipping, no KYC.
- **x402** is a Coinbase + Cloudflare payment protocol (HTTP 402 status code). 100M+ payments processed. Solana handles 50-80% of all x402 transactions. This is legitimate infrastructure.
- The purchase happens server-side via a Supabase Deno edge function. The donor's only interaction is the existing USDC donation flow via MWA on their Seeker device.
- **Agent wallet:** A server-side Solana keypair that Glimpse controls. Funded with USDC for purchases. The donor's USDC goes to the Glimpse pool wallet (same as current donations), then the agent wallet spends from its own balance to buy on Amazon. This separation is intentional.

---

## Database Schema (For Reference)

New tables being added (migration 018):

```sql
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
  shipping_address JSONB,  -- admin-only, hidden from donors via RLS
  status TEXT NOT NULL DEFAULT 'open',
    -- open | funded | purchasing | ordered | shipped | delivered | failed
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
  status TEXT NOT NULL DEFAULT 'pending',
    -- pending | cart_created | order_created | payment_sent | paid | ordered | shipped | delivered | failed
  error_message TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Existing donations table gets a new FK column:
ALTER TABLE donations ADD COLUMN classroom_need_id UUID REFERENCES classroom_needs(id);
```

---

## Key Files to Reference

| File | What It Is |
|------|------------|
| `docs/design/brand-guide.md` | Full design system (colors, typography, components, animation) |
| `docs/plans/2026-03-05-proof-first-redesign-design.md` | Current design language (ProofCard, typography, theme) |
| `docs/plans/2026-03-08-classroom-needs-design.md` | Full architecture design doc from this session |
| `screens/CampaignsScreen.tsx` | Current Glimpses tab (where "NEEDS" toggle goes) |
| `screens/GiveScreen.tsx` | Current donation form (needs pre-fill modifications) |
| `screens/MessagesScreen.tsx` | Current messages/chat (proof displays here) |
| `ui/ProofCard.tsx` | Existing proof display component |
| `navigation/AppNavigator.tsx` | Tab navigation structure |
| `config/donationConfig.ts` | Campaign definitions |
| `docs/SOUL.md` | Founder voice and narrative |
| `CLAUDE.md` | Full architecture documentation |

---

## Deliverable Expected From You

**UI layout designs for the 5 areas listed above.** Wireframes, mockups, or detailed component specifications — whatever format you work best in. Focus on:

1. Visual hierarchy and information architecture
2. How classroom need cards feel distinct but cohesive with existing design
3. The flow from browsing needs → funding → seeing proof
4. Status indicator design across the purchase lifecycle
5. How the pre-filled Give screen differs from the standard donation flow

**Do not write implementation code.** Derrick will bring your layout designs back to Claude Code for the full buildout (schema, edge functions, React Native components, Sp3nd integration). After implementation, you'll audit the code.

---

## Founder's Design North Star

> "Beautiful, elegant, magnificent — the best app of 2026."

The app should feel premium and intentional. Restrained palette, strong typography, high contrast, low ornament. The proof-of-impact moment (seeing that your $30 bought markers that are now in a classroom) should be emotionally powerful.

**Key tagline:** "Give. See the proof. Start a conversation."

**For classroom needs specifically:** The proof is concrete and tangible — not abstract cause categories, but a real Amazon product arriving at a real school. The design should make that tangibility feel special.
