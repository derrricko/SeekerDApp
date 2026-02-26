# Glimpse v2 — Solana Mobile DApp

## What Changed (v1 → v2)

Glimpse pivoted from a complex USDC escrow/vault system to a simple, direct SOL donation app with on-chain receipts and donor-recipient messaging. Built for the Monolith hackathon by a solo founder.

**v1 (archived on `feat/visual-skeleton-rework`):** USDC SPL transfers, Anchor escrow program, vault PDAs, campaigns, activity-weighted giving, glassmorphism design system, SIWS auth.

**v2 (this branch `v2/give-portal`):** SOL transfers with Memo receipts, Supabase Realtime chat, 3-tab app (Give, Messages, Leaderboard placeholder). Zero escrow, zero USDC, zero vaults.

## App Architecture

### Navigation Flow
```
App.tsx → AppNavigator (3 bottom tabs)
           ├── Give tab (default) — wallet connect, recipient picker, SOL transfer
           ├── Messages tab — conversation list → chat room
           └── Leaderboard tab — "Coming soon" placeholder
```

### Key Files
```
App.tsx                                — Root: Connection → Wallet → Navigator
index.js                               — Polyfills + app registration
globals.js                             — Buffer, process, btoa/atob polyfills
metro.config.js                        — Metro bundler with Node.js module stubs
config/env.ts                          — Cluster, RPC, Supabase creds, Memo program ID
data/recipients.ts                     — Hardcoded recipient list

screens/GiveScreen.tsx                 — Single scrollable donation flow
screens/MessagesScreen.tsx             — Conversation list + chat view
screens/LeaderboardScreen.tsx          — "Coming soon" placeholder

components/providers/ConnectionProvider.tsx — Solana RPC connection
components/providers/WalletProvider.tsx     — MWA wallet (connect, sign, send)

services/supabase.ts                   — Supabase client factory
services/donations.ts                  — executeDonation() orchestrator
services/chat.ts                       — Chat CRUD + useChatMessages hook

utils/transfer.ts                      — SOL transfer + Memo instruction builder
utils/errors.ts                        — Result<T> type, MWA/tx error handling
utils/explorer.ts                      — Solana Explorer URL builder
utils/retry.ts                         — AsyncStorage retry queue for orphaned donations

navigation/AppNavigator.tsx            — Bottom tab navigator

docs/SOUL.md                           — Founder voice & narrative
docs/glimpse-stats.md                  — Market research & statistics
TODOS.md                               — Deferred work with full context
```

### Data Flow
```
  ┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
  │  GIVE SCREEN │────▶│  SOLANA TX   │────▶│  ON-CHAIN MEMO   │
  │  Pick recip  │     │  SOL + Memo  │     │  {d,r,a,t,app}   │
  │  Enter amount│     │  via MWA     │     │                  │
  └─────────────┘     └──────┬───────┘     └──────────────────┘
                             │ tx confirmed
                             ▼
                    ┌────────────────┐     ┌──────────────────┐
                    │  SUPABASE      │────▶│  MESSAGE PORTAL  │
                    │  Record tx     │     │  donor ↔ admin   │
                    │  Create room   │     │  photos/receipts │
                    └────────────────┘     └──────────────────┘
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
- Tokens: Native SOL (NOT USDC — v2 simplification)
- Chain: Solana devnet
- Backend: Supabase (PostgreSQL + Realtime + Storage)
- Auth: Wallet-sign verification (NOT SIWS)
- Solana SDK: @solana/web3.js v1

## SOL Donation Flow
1. User connects wallet via MWA
2. Picks a recipient from hardcoded list
3. Enters SOL amount (or taps preset)
4. App builds tx: SystemProgram.transfer + Memo instruction (atomic)
5. MWA signAndSendTransactions
6. On confirm: record in Supabase + create chat conversation
7. If Supabase fails: queue in AsyncStorage, retry on next open

## Memo Format (On-Chain Receipt)
```json
{"d":"HQ5C58Tu","r":"4vGRAMXy","a":0.5,"t":1709000000,"app":"glimpse"}
```
- `d`: donor wallet (first 8 chars)
- `r`: recipient wallet (first 8 chars)
- `a`: amount in SOL
- `t`: unix timestamp (seconds)
- `app`: "glimpse" (identifies Glimpse transactions)

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

## Chat Architecture
- **Backend:** Supabase Realtime (postgres_changes on `messages` table)
- **Media:** Supabase Storage (`chat-media` bucket), image transforms via URL params
- **Access control:** RLS on conversations + messages (donor_wallet OR admin_wallet)
- **Hook:** `useChatMessages(conversationId)` — handles subscribe/unsubscribe/reconnect

## Key Packages (v2 — stripped down)
```
@solana/web3.js                    — Solana core (Connection, Transaction, SystemProgram)
@solana-mobile/mobile-wallet-adapter-protocol-web3js — MWA
@solana-mobile/wallet-standard-mobile — Wallet standard
@supabase/supabase-js              — Chat, donations, auth
@react-navigation/native           — Navigation
@react-navigation/bottom-tabs      — Tab bar
react-native-screens               — Native screen containers
react-native-safe-area-context     — Safe area
@react-native-async-storage/async-storage — Retry queue, auth tokens
```

**Removed from v1:** `@coral-xyz/borsh`, `@solana/spl-token`, `bn.js`, `@react-native-community/blur`, `react-native-haptic-feedback`

## Testing
- Emulator: Android Studio AVD (Pixel_6 API 35)
- Device: Solana Seeker with USB debugging
- Build: `npx react-native run-android`
- Bundle check: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle`

## Known Polyfill Requirements
- `globals.js` MUST be first import in `index.js` (Buffer, process)
- `react-native-get-random-values` MUST be second import (crypto)
- RN 0.76 Hermes has native TextEncoder/TextDecoder — do NOT polyfill
- Metro resolver maps Node.js built-ins in `metro.config.js`
