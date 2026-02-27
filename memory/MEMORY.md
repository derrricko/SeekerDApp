# Project Memory — Glimpse v2

Last updated: 2026-02-26
Branch: `v2/give-portal`

## Current State

- App is in v2 architecture: direct SOL donations + messaging.
- Latest hardening commit: `cff284ac`.
- Working tree is clean except investor one-pager docs (`docs/`), which are intentionally untracked.

## Core Security Decisions

- Wallet auth is signature-based (`glimpse-auth:{timestamp}`) via `wallet-auth` edge function.
- Supabase access is JWT-scoped per wallet (`wallet` claim), not anonymous.
- Donation recording is server-verified in `record-donation` edge function:
  - fetches tx from Solana RPC
  - validates sender wallet = JWT wallet
  - validates recipient wallet = selected recipient map
  - validates memo markers and amount
  - upserts donation/conversation idempotently
- RLS policies are participant-scoped and service-role insert-only for donations/conversations.
- Auth replay protection added with `auth_challenges` table.

## Critical Files

- Wallet/auth: `components/providers/WalletProvider.tsx`, `services/auth.ts`, `services/supabase.ts`
- Donation flow: `services/donations.ts`, `utils/transfer.ts`, `utils/retry.ts`
- Chat flow: `services/chat.ts`, `screens/MessagesScreen.tsx`
- Edge functions: `supabase/functions/wallet-auth/index.ts`, `supabase/functions/record-donation/index.ts`
- Migrations: `supabase/migrations/001_v2_tables.sql`, `supabase/migrations/002_v2_hardening.sql`, `supabase/migrations/003_v2_auth_replay_guard.sql`

## Verification Baseline

- `npm run lint` passes.
- `npx tsc --noEmit` passes.
- `npm test -- --watch=false --watchman=false` passes.
- Android production bundle check passes.

## Remaining Backend Steps

1. `supabase db push`
2. Deploy edge functions:
   - `wallet-auth`
   - `record-donation`
3. Run E2E on device:
   - connect wallet
   - make donation
   - verify chat conversation appears
