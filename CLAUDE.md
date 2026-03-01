# Glimpse v2 — Solana Mobile DApp

## Mainnet Filter (Locked)

Keep in mind the main goal is getting this app to mainnet ASAP. Number 1 priority filter everything through that. Things like leaderboard are not a priority. The giving flow must be airtight. We must get to mainnet so we can start taking in donations, even if it is only one donation. We must deploy the app to the Solana dApp Store.

### North Star

Ship one path that works end-to-end on mainnet:

`connect wallet -> donate USDC -> confirm on-chain -> record in backend -> open message thread`

If that works reliably, we can launch and take donations.

### Execution Rules

1. Freeze scope on anything not required for the North Star path.
2. Hardening beats new features.
3. dApp Store prep runs in parallel, but never blocks transaction reliability work.

### Explicitly Deprioritized (Until First Mainnet Donation)

1. Leaderboard implementation.
2. Group pooling mechanics beyond metadata capture.
3. Non-essential polish unrelated to conversion/reliability.
4. Legacy cleanup that does not affect launch path stability.

## Default Collaboration Profile (Locked)

Use this skill stack by default for all implementation and review work:

1. `interface-design` for screen structure, spacing, hierarchy, and visual consistency
2. `interaction-design` for transitions, microinteractions, and UX polish
3. `fixing-motion-performance` when motion feels slow or unstable on device
4. `12-principles-of-animation` as final animation quality audit
5. `solana-dev` referenced on every code change (frontend or backend) to ensure Solana best-practice alignment

Rule: any touched code path should be checked against the Solana dev playbook before sign-off.

## What Changed (v1 → v2)

Glimpse pivoted from a complex USDC escrow/vault system to a direct USDC donation app with on-chain receipts, cause-preference matching, 48-hour custodial hold, and donor-recipient messaging. Built for the Monolith hackathon by a solo founder.

**v1 (archived on `feat/visual-skeleton-rework`):** USDC SPL transfers, Anchor escrow program, vault PDAs, campaigns, activity-weighted giving, glassmorphism design system, SIWS auth.

**v2 (this branch `v2/give-portal`):** USDC SPL transfers with Memo receipts, cause-preference matching, Solo/Group metadata, 48-hour custodial hold, Supabase Realtime chat, 4-tab app (Glimpses, Give, Messages, Rank placeholder).

## App Architecture

### Navigation Flow
```
App.tsx → AppNavigator (4 bottom tabs)
           ├── Glimpses tab — campaign overview
           ├── Give tab — wallet connect, cause selection, USDC transfer
           ├── Messages tab — conversation list → chat room
           └── Rank tab — leaderboard placeholder
```

### Key Files
```
App.tsx                                — Root: Connection → Wallet → Navigator
index.js                               — Polyfills + app registration
globals.js                             — Buffer, process, btoa/atob polyfills
metro.config.js                        — Metro bundler with Node.js module stubs
config/env.ts                          — Cluster, RPC, Supabase creds, USDC mint, Memo program ID
data/donationConfig.ts                 — CAUSE_OPTIONS, MATCHING_POOL, DonationCadence, DonationMode

screens/GiveScreen.tsx                 — Cause multi-select, USDC amount, Solo/Group, cadence
screens/MessagesScreen.tsx             — Conversation list + chat view
screens/CampaignsScreen.tsx            — Campaign overview (Glimpses tab)
screens/HowItWorksCarousel.tsx         — Onboarding carousel

components/providers/ConnectionProvider.tsx — Solana RPC connection
components/providers/WalletProvider.tsx     — MWA wallet + wallet-signed Supabase auth
components/providers/AppStateProvider.tsx   — Local app state (leaderboard, feed, glimpses)

services/auth.ts                       — createWalletAuthMessage, authenticateWalletSignature
services/supabase.ts                   — Supabase client + JWT token management
services/donations.ts                  — executeDonation() orchestrator (USDC)
services/chat.ts                       — Chat CRUD + useChatMessages hook

utils/transfer.ts                      — USDC SPL transferChecked + Memo instruction builder
utils/errors.ts                        — Result<T> type, MWA/tx error handling (USDC errors)
utils/explorer.ts                      — Solana Explorer URL builder
utils/retry.ts                         — AsyncStorage retry queue for orphaned donations
utils/base64.ts                        — Base64 encode/decode (MWA address parsing)
utils/utf8.ts                          — UTF-8 encoding wrapper

supabase/functions/wallet-auth/index.ts     — Ed25519 verify → JWT issuance
supabase/functions/record-donation/index.ts — SPL transferChecked validation → upsert donation
supabase/migrations/001_v2_tables.sql       — Schema (donations, conversations, messages)
supabase/migrations/002_v2_hardening.sql    — RLS policies + current_wallet()
supabase/migrations/003_v2_auth_replay_guard.sql — Auth challenge replay guard
supabase/migrations/004_v2_donation_cadence_and_stage.sql — cadence + impact stage metadata
supabase/migrations/005_v2_usdc_hold_tracking.sql — USDC amount, hold tracking, cause preferences

navigation/AppNavigator.tsx            — Bottom tab navigator (exports RootTabParamList)

docs/SOUL.md                           — Founder voice & narrative
docs/research/glimpse-stats.md         — Market research & statistics
docs/handoffs/                         — AI agent handoff docs (archived)
docs/launch/                           — Launch checklists, privacy policy, dApp Store copy
docs/design/                           — Brand guide, wireframes, social assets, web mockups
docs/pitch/                            — Pitch decks and investor materials
STATUS.md                              — Living ship status (what works, what blocks)
memory/MEMORY.md                       — Persistent cross-session memory and backend runbook
TODOS.md                               — Deferred work with full context
```

### Data Flow
```
  GiveScreen                    transfer.ts                  On-Chain
  ┌──────────────┐             ┌───────────────────┐        ┌──────────────────┐
  │ Select causes │            │ Derive donor ATA   │        │ SPL transferCheck│
  │ (multi, ≤3)  │            │ Derive pool ATA    │        │ USDC mint valid  │
  │ Enter USDC   │───────────▶│ Check USDC balance │───────▶│ Memo: {tok:usdc} │
  │ Pick cadence │            │ Build SPL tx + Memo│        │                  │
  │ Solo/Group   │            └───────────────────┘        └────────┬─────────┘
  └──────────────┘                                                   │ confirmed
                                                                     ▼
                              record-donation edge fn         Supabase
                              ┌───────────────────────┐      ┌──────────────────┐
                              │ Fetch jsonParsed tx    │      │ donations        │
                              │ Find transferChecked ix│      │  amount_usdc     │
                              │ Validate USDC mint     │─────▶│  donation_mode   │
                              │ Validate pool ATA      │      │  hold_status     │
                              │ Validate memo.tok=usdc │      │  hold_expires_at │
                              │ Store cause_preferences│      │  cause_preferences│
                              └───────────────────────┘      │ conversations    │
                                                              │ messages         │
                                                              └──────────────────┘
```

## Founder Voice & Product Soul

> For the full conviction story, see `docs/SOUL.md`.
> For market research, see `docs/glimpse-stats.md`.

### Sacred lines — use verbatim, never paraphrase
> "Most people's entire lives will be forever changed by a few thousand dollars."
> "GoFundMe takes three percent. We take zero."
> "Four years. NFT project, partner search, traditional fundraising — none of it worked. Now I built it myself."
> "My son is one year old. I'm building the world I want him to grow up in."

## Project Stack
- Frontend: React Native 0.76.5 + TypeScript ~5.3
- Target Device: Solana Seeker (Android)
- Wallet: Mobile Wallet Adapter (MWA) 2.0
- Tokens: USDC (SPL Token) — 6 decimals
- Chain: Solana devnet
- Backend: Supabase (PostgreSQL + Realtime + Storage)
- Auth: Wallet-sign verification (NOT SIWS)
- Solana SDK: @solana/web3.js v1 + @solana/spl-token v0.3.x

## USDC Donation Flow
1. User connects wallet via MWA
2. Selects up to 3 causes (cause-preference matching)
3. Chooses Solo or Group donation mode (metadata only)
4. Enters USDC amount (max 10,000 USDC)
5. Picks cadence (one-time or daily)
6. App builds tx: SPL transferChecked + Memo instruction (atomic)
7. MWA signAndSendTransactions
8. On confirm: record in Supabase + create chat conversation + 48h hold
9. If Supabase fails: queue in AsyncStorage, retry on next open

All donations go to the matching pool wallet. Cause preferences help match donors to needs.

## Memo Format (On-Chain Receipt)
```json
{"d":"HQ5C58Tu","r":"DdqT7Fek","a":5.00,"t":1709000000,"app":"glimpse","tok":"usdc","c":"one_time"}
```
- `d`: donor wallet (first 8 chars)
- `r`: pool wallet (first 8 chars)
- `a`: amount in USDC
- `t`: unix timestamp (seconds)
- `app`: "glimpse" (identifies Glimpse transactions)
- `tok`: "usdc" (token identifier)
- `c`: cadence ("one_time" or "daily")

## Hold Status State Machine
```
  pending ──(processing)──▶ locked ──(admin action)──▶ released
```
- Hold is custodial (admin releases when donation is matched)
- Done screen copy: "Your donation is being processed. We are connecting you to a need..."

## Wallet Auth Flow
```
  MWA authorize() → wallet.signMessages("glimpse-auth:{timestamp}")
       │                        │
       │                        ▼
       │            services/auth.ts → POST /functions/v1/wallet-auth
       │                        │
       │                        ▼
       │            Edge fn: verify ed25519 sig → issue JWT {wallet, role, exp}
       │                        │
       │                        ▼
       │            services/supabase.ts → store JWT, recreate client
       │
       └── publicKey set → app ready for donations
```

- Auth message format: `glimpse-auth:{unix_ms_timestamp}` (5-min window)
- JWT claims: `{ wallet, role: "authenticated", aud: "authenticated", exp }`
- Token stored in AsyncStorage at `@glimpse_wallet_jwt`
- `hydrateSupabaseAccessToken()` restores token on cold start
- Migration 003 adds `auth_challenges` table to prevent replay

## Server-Side Donation Recording
```
  After confirmTransaction() on-chain:
       │
       ▼
  POST /functions/v1/record-donation  { txSignature, recipientId, causePreferences, donationMode }
       │  (Bearer JWT from wallet-auth)
       ▼
  Edge fn:
    1. Verify JWT → extract wallet
    2. Fetch tx from Solana RPC (jsonParsed, 6 retries)
    3. Find spl-token transferChecked instruction
    4. Validate: info.mint ∈ VALID_USDC_MINTS
    5. Validate: info.authority = JWT wallet (donor)
    6. Validate: info.destination = MATCHING_POOL_USDC_ATA
    7. Validate: memo has tok="usdc", app="glimpse", amounts match
    8. Upsert donation row (amount_usdc, hold_status, cause_preferences, donation_mode)
    9. Upsert conversation + welcome message (48h hold copy)
   10. Return { conversationId }
```

If recording fails, the tx is on-chain but orphaned. `addPendingConversation()` queues it in AsyncStorage. `retryPendingConversations()` runs on next wallet connect.

## Error Handling Pattern
```typescript
import { Result, ok, fail, safeAsync } from './utils/errors';

// All services return Result<T>
const result = await executeDonation(...);
if (result.success) {
  // result.data is DonationResult
} else {
  // result.error is { code, message, recoverable }
}
```

Key USDC error codes: `INSUFFICIENT_USDC`, `USDC_ACCOUNT_NOT_FOUND`, `INSUFFICIENT_SOL` (for tx fees).

## Supabase Backend

### Tables (migration 001 + 004 + 005)
- `donations` — tx_signature (unique), donor_wallet, recipient_wallet, recipient_id, amount_sol (legacy), amount_usdc, cadence, donation_mode, hold_status, hold_expires_at, cause_preferences
- `conversations` — donation_id (FK), donor_wallet, admin_wallet
- `messages` — conversation_id (FK), sender_wallet, body, media_url, media_type

### RLS (migration 002)
- `current_wallet()` SQL fn extracts wallet from JWT `request.jwt.claims`
- Donations: **service_role insert only**, read by donor or recipient wallet
- Conversations: **service_role insert**, read by donor or admin wallet
- Messages: participant insert (sender_wallet must match), participant read via conversation join
- Storage (`chat-media`): participant upload/read scoped by conversation_id in file path

### Edge Functions
- `wallet-auth` — ed25519 signature verify → JWT issuance (24h TTL)
- `record-donation` — SPL transferChecked validation → upsert donation + conversation
  - Validates USDC mint, pool ATA, memo tok="usdc"
  - Stores cause_preferences, donation_mode, hold_status, hold_expires_at

### Chat Architecture
- **Realtime:** Supabase postgres_changes on `messages` table
- **Media:** Supabase Storage (`chat-media` bucket), image transforms via URL params
- **Hook:** `useChatMessages(conversationId)` — subscribe before fetch, insertSorted, dedup by id

## Key Packages
```
@solana/web3.js                    — Solana core (Connection, Transaction, PublicKey)
@solana/spl-token                  — SPL token (ATA derivation, transferChecked, getAccount)
@solana-mobile/mobile-wallet-adapter-protocol-web3js — MWA
@solana-mobile/wallet-standard-mobile — Wallet standard
@supabase/supabase-js              — Chat, donations, auth
@react-navigation/native           — Navigation
@react-navigation/bottom-tabs      — Tab bar
react-native-screens               — Native screen containers
react-native-safe-area-context     — Safe area
@react-native-async-storage/async-storage — Retry queue, auth tokens
```

## Testing
- Unit tests: `npx jest` (transfer, errors, base64, auth)
- Emulator: Android Studio AVD (Pixel_6 API 35)
- Device: Solana Seeker with USB debugging
- Build: `npx react-native run-android`
- Bundle check: `node node_modules/react-native/cli.js bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle`

## Known Polyfill Requirements
- `globals.js` MUST be first import in `index.js` (Buffer, process)
- `react-native-get-random-values` MUST be second import (crypto)
- RN 0.76 Hermes has native TextEncoder/TextDecoder — do NOT polyfill
- Metro resolver maps Node.js built-ins in `metro.config.js`

## Default Delivery Preferences (Project Owner)
- Keep outputs **professional, minimal, and investor-grade** by default.
- Go **one layer up in abstraction**: lead with thesis, positioning, and business impact before details.
- Preserve core meaning, but tighten wording for clarity and decision-readiness.
- Prefer clean visual systems: restrained palette, strong typography, high contrast, low ornament.
- Avoid busy layouts, heavy glow/shading, and decorative effects unless explicitly requested.
- For design deliverables, prioritize readability in browser and PDF export.
- For instructions, use plain English and explicit step-by-step terminal commands when needed.
