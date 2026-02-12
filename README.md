# GLIMPSE

### Documenting Kindness

> $592.5 billion flows into charity every year. Donors get a thank-you letter. Recipients see cents on the dollar. And the connection between giver and impact? It doesn't exist.
>
> Glimpse fixes that.

A Solana Mobile giving app built for the Seeker device. Direct USDC donations to verified needs. Zero platform fees. Every gift documented with photos, receipts, and real stories — recorded permanently on-chain.

---

## The Problem

The charitable giving industry is losing its donors.

- **73.7% of donors don't come back.** Overall donor retention sits at 26.3% — nearly 3 out of 4 donors give once and disappear. *(Fundraising Effectiveness Project, Q2 2025)*
- **New donor retention: 7.2%.** For every 100 first-time donors, 93 never give again. *(Kindsight/FEP, Q1 2024)*
- **The #1 reason donors leave: they never see what their money did.** No feedback, no proof, no connection to impact. *(Dataro/Bloomerang/FEP aggregate findings)*
- **The model hasn't changed since 1969.** Over 55 years of the same structure — layers of overhead, endless grant applications, donors left wondering if their gift mattered.
- **Even the best-rated charities spend ~25% on overhead** before a dollar reaches anyone. Fundraising platforms charge 3–10% on top of that. *(CharityWatch, Zeffy)*

The sector is raising more money from fewer people. That's not growth — it's a structural vulnerability.

## The Insight

There's a moment in every donor's journey called **the golden donation** — the second gift.

- If a donor gives **once**, retention is 13.9%.
- If they give **twice**, retention jumps to **59%**.
- If they give **seven or more times**, retention reaches **86.2%**.

*(FEP Q2 2025 via Bloomerang)*

The entire retention crisis comes down to one question: **can you get someone to give a second time?**

The answer is connection. Show a donor what their money did — who it helped, what changed, with proof — and they come back. Glimpse is built around that moment.

## The Solution

Glimpse is direct giving with on-chain proof.

1. **Choose a need** — Real, verified needs from real people. A shower for someone on the street ($25). Groceries for a single mom ($100). A month's rent for a family facing eviction ($1,000).

2. **Give** — Your full donation transfers directly via USDC on Solana. No platform fees. No admin cuts. No middlemen.

3. **Wait for it** — You won't know exactly who you helped until after your gift lands.

4. **See the impact** — Photos. Receipts. The real story. Documented and delivered — proof that your generosity landed.

Think of it as a personal giving team. We do the legwork. You get the proof.

## Real Needs, Real People

These are live on Solana devnet today — verified needs with on-chain escrow vaults:

| Need | Amount | The Story |
|------|--------|-----------|
| **A clean shower and fresh clothes** | $25 | For someone living on the street, a hot shower and clean clothes aren't just hygiene — they're dignity. The feeling of being human again. |
| **Groceries for a single mom** | $100 | She skips meals so her kids don't have to. Your gift fills a fridge and quiets the worry at 2am. |
| **New wardrobe for a foster kid** | $250 | When a child enters foster care, everything they own fits in a trash bag. New clothes say: you matter. |
| **New tires for a family in need** | $400 | She white-knuckles the steering wheel every morning, praying the bald tires hold — to get her kids to school and herself to work. |
| **Full month's rent for a family** | $1,000 | An eviction notice doesn't just mean losing a home — it means a child wondering where they'll sleep tomorrow. |

Every need is personally vetted through community members, teachers, church leaders — the boots-on-the-ground people who have real relationships.

## Why Solana. Why Seeker.

**Why blockchain?** Trust, but verify. Every donation is recorded on Solana — a public, permanent ledger anyone can audit. No one can edit it. No one can hide it. Not even us.

**Why Solana specifically?**
- Sub-second transaction finality
- Transaction fees under $0.01
- Stablecoins processed nearly $30 trillion in 2024 — more than Visa and Mastercard combined
- The infrastructure for real-time, global, transparent giving already exists

**Why the Seeker?** Giving is personal. It should happen in your hand, not on a desktop dashboard. The Solana Seeker is a mobile-first crypto device — the exact form factor for a giving app that lives in your pocket. Tap, sign, give, see proof.

## The Market

| Metric | Number | Source |
|--------|--------|--------|
| U.S. charitable giving (2024) | **$592.5B** | Giving USA 2025 |
| Individual giving | **$392.5B** (66% of total) | Giving USA 2025 |
| Crypto donations (2024) | **$1B+** (record year) | The Giving Block |
| Projected crypto giving (2025) | **$2.5B** | The Giving Block |
| Charity platform market (2024) | **$1.09B** → $2.51B by 2033 | Business Research Insights |
| Generational wealth transfer | **$84.4T** underway | The Giving Block |

Crypto donors are young, financially savvy, and transparency-obsessed. **95% of surveyed crypto owners** have made charitable contributions. They're already giving at record levels — but through the same traditional rails. Glimpse offers what they actually want: on-chain proof, direct connection, zero overhead.

## Current State

Glimpse is live on Solana devnet with a complete giving flow:

- **Escrow program deployed** — Anchor 0.30.1 program with `initialize_need`, `donate`, and `disburse` instructions
- **5 vault PDAs initialized** — Real needs with on-chain escrow accounts
- **9 integration tests passing** — Full coverage of happy paths, auth checks, and edge cases (LiteSVM)
- **Complete mobile app** — React Native with glassmorphic design system, animated onboarding, MWA wallet integration
- **Zero platform fees** — 100% of every donation goes to the need
- **On-chain transparency** — Every transaction viewable on Solana Explorer

### Program Details

| Component | Address |
|-----------|---------|
| Escrow Program | `7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE` |
| Admin Wallet | `HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5` |
| USDC Mint (devnet) | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

### Vault PDAs (Devnet)

| Slug | PDA | Target |
|------|-----|--------|
| shower | `5Qnw3W3MbF6oNmPhN5Nfh93g51hKppFtH5y6TkZPMEsM` | $25 |
| groceries | `CnxrG6ScusNpSFVyy4Ti34ZE5bjYhRVVWHTN73859S5c` | $100 |
| wardrobe | `EW82JfL5rZxEsjuL3pJovyugYbtF1PPhEL7ejZQ6MmKa` | $250 |
| tires | `HjfPfQvx1wy5BRKDZxrFCKde3KY74pJypyNQQuxASEVf` | $400 |
| rent | `EMmuGFWUJbpjopt2DqZAyQLnSnEKK4dVLqbpy9shr26k` | $1,000 |

## Demo

> *Demo video coming soon — recorded on a Solana Seeker device.*

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Solana Seeker (Android)                                │
│  ┌───────────────┐  ┌─────────────────────────────────┐ │
│  │  Glimpse App   │  │  MWA Wallet (Phantom/Solflare) │ │
│  │  React Native  │──│  Signs & sends transactions    │ │
│  └───────┬───────┘  └─────────────────────────────────┘ │
└──────────┼──────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│  Solana Devnet                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Glimpse Escrow Program                           │  │
│  │  ┌──────────────┐ ┌────────┐ ┌──────────┐        │  │
│  │  │initialize_need│ │ donate │ │ disburse │        │  │
│  │  └──────────────┘ └────────┘ └──────────┘        │  │
│  │                                                   │  │
│  │  NeedVault PDAs (5 active)                        │  │
│  │  [shower] [groceries] [wardrobe] [tires] [rent]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  USDC (SPL Token) ──── Direct transfers, no intermediary│
└─────────────────────────────────────────────────────────┘
```

**Stack**: React Native 0.76 · TypeScript · Anchor 0.30.1 (Rust) · MWA 2.0 · @solana/web3.js v1 · USDC (SPL)

## On-Chain Security

- **USDC mint pinned**: All instructions validate against the hardcoded devnet USDC address. Prevents fake-mint attacks.
- **Admin-only initialization**: Only the admin wallet can create vault PDAs.
- **Signer validation**: All mutating instructions require cryptographic signature verification.
- **Checked arithmetic**: All math uses `checked_add` / `checked_sub` to prevent overflow.
- **PDA derivation**: Deterministic seeds `["need", slug_bytes]` with stored bumps.
- **Disbursement guards**: Double-disburse and post-disburse donations are rejected.

---

## Developer Setup

### Prerequisites

- Node.js 18+
- Android Studio with an AVD (Pixel 6, API 35) or a Solana Seeker device
- An MWA-compatible wallet app installed on the device/emulator
- Rust + Solana CLI (only needed for escrow program development)

### Install & Run

```bash
npm install
npx react-native start
```

```bash
npx react-native run-android
```

### Bundle Check

```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

### Escrow Program Tests (LiteSVM)

Requires `protoc` (`brew install protobuf`) and a built `.so`:

```bash
cargo-build-sbf --manifest-path programs/glimpse-escrow/Cargo.toml --sbf-out-dir target/deploy
cargo test --manifest-path programs/glimpse-escrow/Cargo.toml --test escrow_test
```

9 integration tests covering `initialize_need`, `donate`, and `disburse` instructions.

### Lint

```bash
npm run lint
```

### Project Structure

```
screens/                  App screens (Welcome, Onboarding, Home)
components/               GlassCard, theme system, providers
utils/                    USDC transfer, escrow instruction builder, error handling
config/                   Environment config (program IDs, mints, Supabase creds)
data/                     Shared content constants (FAQ, tiers, slides)
programs/glimpse-escrow/  Anchor escrow program (Rust)
supabase/migrations/      Database schema (001-005)
supabase/functions/       Edge functions (nonce, siws-verify, record-transaction)
scripts/                  One-time setup scripts (vault initialization)
docs/                     Research, brand guide, archived references
```

### Environment

The app uses hardcoded devnet configuration in `config/env.ts`. See [CLAUDE.md](./CLAUDE.md) for the full architecture reference, design system, security model, and build troubleshooting.

---

*Glimpse — Muscatine, Iowa · Built on Solana · @DerrickWKing*
