# Glimpse — Ship Status

Last updated: 2026-03-07
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

## Recent Changes (2026-03-07)

- UI reset to the closer-to-App-Store baseline instead of the broader redesign
- Onboarding simplified to a trust-first 3-step flow
- Give/Confirm/Messages screens polished for final demo walkthroughs
- Dark theme/runtime theme switching removed; app is light-only
- Thread headers and keyboard behavior tightened on device
- Helius webhook now fails closed if auth token is missing
- Chat media upload filenames are sanitized before storage upload

## Final Hackathon Push

Hackathon mode is now in final QA, not active redesign.

### Remaining Must-Verify Items
1. One real `$1` mainnet donation end to end
2. Two-phone donor/admin messaging test
3. Final APK decision: keep submitted build or ship a version-bumped update

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

## dApp Store Submission

- **Submitted:** 2026-03-03 at 4:18 AM CST
- **Transaction:** `4NsEgmAt2PpuCqTaPi5NJiE5SdCW6wpPuSNDax79bTfDr4mrZ55zgJxXDU7BEVAQg68ou8PH29FWCtDcCjS3Em1H`
- **Explorer:** https://explorer.solana.com/tx/4NsEgmAt2PpuCqTaPi5NJiE5SdCW6wpPuSNDax79bTfDr4mrZ55zgJxXDU7BEVAQg68ou8PH29FWCtDcCjS3Em1H
- **App NFT:** `EXaw3mEfQWgxxNQWNiuHAYYu8nNXYqeF8srpboudEXa`
- **Release NFT:** `F6uhmhv27PstFHkzymPKQ53DFGFuUSigPpZNNrHtxe4h`
- **Publisher Wallet:** `HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5`
- **Status:** Pending review

## Edge Functions (Deployed)

| Function | Status | Notes |
|---|---|---|
| `wallet-auth` | ACTIVE | JWT issuance from wallet signature |
| `record-donation` | ACTIVE | Client-side tx validation + recording |
| `helius-webhook` | ACTIVE | Server-side auto-recording (no-verify-jwt, auth fails closed if secret missing) |
| `nonce` | ACTIVE | Legacy v1, unused |
| `siws-verify` | ACTIVE | Legacy v1, unused |
| `record-transaction` | ACTIVE | Legacy v1, unused |

## Reference

For full architecture and entity structure, see `CLAUDE.md`.
For founder voice, see `docs/SOUL.md`.
For design system, see `docs/design/brand-guide.md`.
For skill spec, see `.agents/skills/solana-seeker-dev/SKILL.md`.
