# Project Memory — Mainnet Readiness

Last updated: 2026-02-27  
Branch: `codex/mainnet-readiness`

## Launch Directive (Do Not Drift)

Mainnet is the only filter right now. Ship one donation path that works reliably end-to-end, then launch and take real USDC donations.

North Star flow:

`connect wallet -> donate USDC -> confirm on-chain -> record in backend -> open message thread`

## What Matters Right Now

1. Donation success and backend recording reliability.
2. Messaging thread creation and send/reply reliability.
3. Mainnet configuration correctness (pool wallet, USDC mint, ATA validation).
4. Release readiness for Solana dApp Store submission.

## Not Priority Until First Donation

1. Leaderboard.
2. Advanced group pooling behavior.
3. Non-essential polish unrelated to conversion or reliability.

## Current Mainnet Blockers

1. Enforce 2-3 cause selection in Give flow.
2. Keep app/edge function pool config synchronized.
3. Normalize server-side recipient metadata for consistency.
4. Remove donor-facing SOL fallback text in USDC flow.
5. Restore fully green lint/type/test gates.

## Core Files for Launch Path

1. `/Users/derrickwoepking/Desktop/SeekerDApp/screens/GiveScreen.tsx`
2. `/Users/derrickwoepking/Desktop/SeekerDApp/services/donations.ts`
3. `/Users/derrickwoepking/Desktop/SeekerDApp/utils/transfer.ts`
4. `/Users/derrickwoepking/Desktop/SeekerDApp/supabase/functions/record-donation/index.ts`
5. `/Users/derrickwoepking/Desktop/SeekerDApp/screens/MessagesScreen.tsx`
6. `/Users/derrickwoepking/Desktop/SeekerDApp/services/chat.ts`
7. `/Users/derrickwoepking/Desktop/SeekerDApp/config/env.ts`

## Go/No-Go Checklist

1. One real USDC mainnet donation succeeds on device.
2. Supabase donation row + conversation row are created correctly.
3. Success screen deep-links to the right thread.
4. No SOL wording in donor-facing donation/messaging path.
5. `npm run lint -- --max-warnings=0` passes.
6. `npx tsc --noEmit` passes.
7. `npm test -- --watch=false --watchman=false` passes.
8. Signed release build installs and runs.
