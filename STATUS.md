# Glimpse — Ship Status

Last updated: 2026-03-05
Branch: `main`

## North Star — ACHIEVED

`connect wallet -> donate USDC -> confirm on-chain -> record in backend -> open message thread`

End-to-end path working on mainnet since 2026-03-02.

## Current Priorities

1. **Hackathon submission** — Monolith 2026, due Sunday March 9 7PM. Demo video + pitch deck + exceptional app.
2. **dApp Store approval** — submitted, waiting on review.
3. **First campaign** — Glimpse company-funded first donation to prove the loop publicly.

## What Works (Mainnet)

- USDC donations via SPL transferChecked + Memo receipt
- Server-side tx validation (mint, authority, destination ATA, memo)
- Wallet-signed auth (ed25519 verify, JWT issuance, 24h TTL)
- Supabase donation recording + conversation creation
- Orphan retry queue (AsyncStorage) on next wallet connect
- SGT gate active server-side (`SGT_GATE_ENABLED` env var)
- Helius RPC for faster reads (mainnet.helius-rpc.com)
- Helius Enhanced Transactions API — on-chain verification for feed badges
- Helius webhook — server-side auto-recording of donations (belt-and-suspenders)
- Dual recording architecture — client + webhook, idempotent on tx_signature
- Per-wallet donation history cache (no cross-wallet bleed)
- Hardened unread badge realtime handling

## Recent Changes (2026-03-05)

- Helius integration: RPC switch, enhanced feed, verified badges, webhook edge function
- Webhook deployed with `--no-verify-jwt` (Helius can't send Supabase JWT)
- P1 fix: webhook uses `recipient_id: general` instead of hardcoded campaign
- P1 fix: cross-wallet history bleed resolved with per-wallet staleness cache
- P2 fix: unread badge increment from unrelated conversations
- Lint cleanup across impacted files

## Active Hackathon Sprint

Hackathon mode active — "hardening beats new features" suspended until 2026-03-09.
Breaking refactors allowed. Design north star: "making an incredibly complex solution feel simple, fun, and look beautiful."

### Sprint Items (In Progress)
1. Onboarding carousel rewrite (3-step: Give, Confirm, See Proof)
2. Dark theme default
3. Home screen redesign (3-Step Strip variant)
4. Verified badge upgrade (Shield + G Monogram)

## Default Operating Skill

`solana-seeker-dev` v2.1 — see `.agents/skills/solana-seeker-dev/SKILL.md`

## Quality Gates

```
npx eslint . --ext .ts,.tsx --max-warnings=0
npx tsc --noEmit
npm test -- --watchAll=false
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/glimpse.bundle
```

If local EMFILE watcher limit fails, use: `CI=true npx react-native bundle ...`

## Edge Functions (Deployed)

| Function | Status | Notes |
|---|---|---|
| `wallet-auth` | ACTIVE | JWT issuance from wallet signature |
| `record-donation` | ACTIVE | Client-side tx validation + recording |
| `helius-webhook` | ACTIVE | Server-side auto-recording (no-verify-jwt) |
| `nonce` | ACTIVE | Legacy v1, unused |
| `siws-verify` | ACTIVE | Legacy v1, unused |
| `record-transaction` | ACTIVE | Legacy v1, unused |

## Reference

For full architecture and entity structure, see `CLAUDE.md`.
For founder voice, see `docs/SOUL.md`.
For design system, see `docs/design/brand-guide.md`.
For skill spec, see `.agents/skills/solana-seeker-dev/SKILL.md`.
