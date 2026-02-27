# Ship Status — Monday March 2 Deadline

> Last updated: 2026-02-26 by Claude Code
> Branch: `v2/give-portal`

## Default Working Mode

- `interface-design` + `interaction-design` for all UI iteration
- `fixing-motion-performance` for lag/stutter fixes
- `12-principles-of-animation` for final motion review
- `solana-dev` referenced on every code touch before merge

This is the default process unless explicitly overridden.

## What Works Right Now

- **Wallet connect** via MWA 2.0 (authorize + sign messages + sign transactions)
- **Wallet-signed auth** → edge function verifies ed25519 → issues JWT with wallet claim
- **SOL donation with memo** — SystemProgram.transfer + Memo v2 in single atomic tx
- **On-chain confirmation** — confirmTransaction with blockhash + lastValidBlockHeight
- **Secure server-side recording** — `record-donation` edge fn fetches tx from RPC, validates memo, upserts donation + conversation
- **RLS hardened** — `current_wallet()` SQL fn + wallet-scoped policies (migrations 001-003)
- **Auth replay guard** — `auth_challenges` table prevents message reuse
- **Retry queue** — orphaned donations (on-chain but Supabase failed) retried on next connect
- **Theme system** — light/dark, glassmorphism cards, typography scale
- **Android debug build compiles** — bundle check passes

## What's Blocking Ship

| # | Blocker | Owner | Status |
|---|---------|-------|--------|
| 1 | Commit all untracked work to git | Claude Code | Completed |
| 2 | Deploy Supabase migrations (001-003) | Derrick | Pending |
| 3 | Deploy edge functions (wallet-auth, record-donation) | Derrick | Pending |
| 4 | E2E test: connect → donate → see conversation | Either | After deploy |
| 5 | Build release APK with signing | Either | After E2E |
| 6 | dApp Store metadata + submission | Derrick | After APK |

## Critical Path

```
 [Commit all]  →  [Deploy Supabase]  →  [E2E on device]  →  [Release APK]  →  [Store submit]
     Day 1            Day 1-2              Day 2-3             Day 3              Day 4
```

## Architecture Snapshot

```
┌─────────────────────────────────────────────────────────────────────────┐
│  REACT NATIVE APP (Seeker / Android)                                    │
│                                                                         │
│  WalletProvider ──── MWA 2.0 ──── Phantom / Solflare                   │
│       │                                                                 │
│       ├── connect(): authorize + signMessages → wallet-auth edge fn     │
│       │                              │                                  │
│       │                    JWT (wallet claim) stored in AsyncStorage     │
│       │                              │                                  │
│       └── signAndSendTransaction() ──┤                                  │
│                                      │                                  │
│  executeDonation()                   │                                  │
│    1. buildDonationTransaction()     │  (SOL + Memo)                    │
│    2. signAndSend() via MWA          │                                  │
│    3. confirmTransaction()           │                                  │
│    4. recordAndCreateConversation ───┼──▶ record-donation edge fn       │
│       (if fails → AsyncStorage)      │       │                          │
│                                      │       ▼                          │
│                                      │   Supabase (RLS)                 │
│                                      │   ├── donations table            │
│                                      │   ├── conversations table        │
│                                      │   └── messages table (Realtime)  │
└─────────────────────────────────────────────────────────────────────────┘
```

## File Locations — 4 Critical Flows

### 1. Wallet Connect + Auth
```
components/providers/WalletProvider.tsx   — MWA authorize + signMessages
services/auth.ts                         — createWalletAuthMessage, authenticateWalletSignature
supabase/functions/wallet-auth/index.ts  — ed25519 verify, JWT issuance
services/supabase.ts                     — token storage + client hydration
```

### 2. Donation
```
services/donations.ts                    — executeDonation() orchestrator
utils/transfer.ts                        — buildDonationTransaction (SOL + Memo)
utils/errors.ts                          — Result<T>, handleMWAError, handleTransactionError
utils/retry.ts                           — AsyncStorage retry queue
```

### 3. Server-Side Recording
```
supabase/functions/record-donation/index.ts — fetch tx, validate, upsert donation + conversation
supabase/migrations/001_v2_tables.sql       — schema (donations, conversations, messages)
supabase/migrations/002_v2_hardening.sql    — RLS policies + current_wallet()
supabase/migrations/003_v2_auth_replay_guard.sql — auth_challenges table
```

### 4. Chat / Messaging
```
services/chat.ts                         — subscribe + fetch + send + upload
screens/MessagesScreen.tsx               — conversation list + chat room
```

## DO NOT TOUCH

- `programs/glimpse-escrow/` — v1 Anchor escrow program. Still deployed to devnet but NOT used by v2. Keep as-is for potential future use.
- `scripts/init-vaults.ts` — v1 vault initialization. Irrelevant to v2.
- `docs/SOUL.md` — Founder narrative. Perfect as-is.
