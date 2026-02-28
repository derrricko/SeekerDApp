# Handoff: Monday Mainnet Launch — Codex Tasks

**Branch:** `v2/mainnet-launch` @ `55f5eaf5`
**Date:** 2026-02-28
**Context:** Code path is complete and hardened. All quality gates green. Schema deployed. What remains is **non-code launch ops** for Solana dApp Store submission.

---

## What's Done

### Infrastructure
- **Migration 008** — idempotent bootstrap of all tables, RLS, indexes, storage (deployed to Supabase)
- **amount_sol** — relaxed to nullable, CHECK dropped (USDC-only app, SOL never donated)
- **hold_expires_at** — column added (edge fn was writing it, column never existed)
- **Edge function** — `record-donation` redeployed with mainnet-only USDC mint, 401/422 error classification
- **Helius RPC** — set as `SOLANA_RPC_URL` secret on Supabase (server-side only, not in client code)

### Security
- **Helius API key** — removed from client, replaced with public RPC
- **auth_challenges RLS** — enabled, no policies = deny all for anon/authenticated
- **Double-tap guard** — `useRef` mutex in UI + module-level `donationMutex` in service
- **Retry hardening** — 7-day eviction, JWT expiry check, 401 treated as transient (not permanent)
- **Top-level-only instruction scan** — prevents CPI injection on server validation
- **recipientId hardcoded server-side** — client value ignored, always `matching-pool`

### Flow
- **Seamless MWA session** — authorize + sign auth + sign tx in one wallet prompt
- **SPL transferChecked + Memo** — atomic tx, NaN guard, 10K USDC cap, balance pre-check
- **Confirmation** — `confirmed` client-side (UX), `finalized` server-side (8 retries, 56s window)
- **Retry queue** — orphaned on-chain donations queued in AsyncStorage, retried on next connect
- **Chat** — subscribe-before-fetch, dedup by id, welcome message with timeline copy

### Quality Gates
- **tsc** — PASS (zero errors)
- **eslint** — PASS (zero warnings, `--max-warnings=0`)
- **jest** — 30/30 PASS (transfer, errors, base64, auth)
- **bundle** — PASS (`--dev false`)

---

## What's Left

### Codex (non-code, can do now)

1. **Host privacy policy** — `docs/privacy-policy.html` is ready, needs a public URL
   - Option A: GitHub Pages (push to gh-pages branch on a repo)
   - Option B: Upload to `giveglimpse.com/privacy`
   - Update URLs in `dapp-store/config.yaml` after hosting

2. **Verify store listing copy** — `docs/dapp-store-listing-copy.md`
   - Short description (80 chars): ready
   - Long description: ready, uses sacred lines from SOUL.md
   - Review for tone/accuracy, edit if needed

3. **Validate dApp Store config** — `dapp-store/config.yaml`
   - All fields populated except `address` (auto-filled by CLI)
   - Update `privacy_policy_url` after hosting
   - Confirm `android_package: com.seekerdapp` matches build.gradle

### Manual (Derrick, on device)

4. **Create 512x512 store icon** → save as `dapp-store/icon-512.png`
5. **Build release APK** — `cd android && ./gradlew assembleRelease`
6. **Install on Seeker** — `adb install android/app/build/outputs/apk/release/app-release.apk`
7. **Run E2E mainnet test** — donate $0.50 USDC through full flow
8. **Take 4 screenshots** (1080x1920) from release build on device:
   - `dapp-store/screenshots/01-campaigns.png`
   - `dapp-store/screenshots/02-give-flow.png`
   - `dapp-store/screenshots/03-confirmation.png`
   - `dapp-store/screenshots/04-messages.png`
9. **Fund publisher keypair** — send ~0.05 SOL to `E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY`

### Submission (after above)

10. **Install CLI** — `npm install --save-dev @solana-mobile/dapp-store-cli`
11. **Validate** — `npx dapp-store validate -k dapp-store/publisher-keypair.json -b ~/Library/Android/sdk/build-tools/34.0.0`
12. **Mint Publisher NFT** — `npx dapp-store create publisher -k dapp-store/publisher-keypair.json -u https://api.mainnet-beta.solana.com`
13. **Mint App NFT** — `npx dapp-store create app -k ...`
14. **Mint Release NFT** — `npx dapp-store create release -k ... -b ...`
15. **Submit** — `npx dapp-store publish submit -k ... --requestor-is-authorized --complies-with-solana-dapp-store-policies`

---

## Key Files

| File | Purpose |
|------|---------|
| `dapp-store/config.yaml` | dApp Store CLI config (publisher, app, release metadata) |
| `dapp-store/publisher-keypair.json` | Solana keypair for NFT minting (GITIGNORED) |
| `docs/privacy-policy.html` | Privacy policy ready to host |
| `docs/dapp-store-listing-copy.md` | Store listing short + long description |
| `docs/MONDAY-LAUNCH-RUNSHEET.md` | Full launch runsheet with go/no-go checklist |
| `docs/CODEX-DAPP-STORE-CHECKLIST.md` | Original asset checklist (reference) |
| `supabase/migrations/008_v2_usdc_only_schema_fix.sql` | Schema bootstrap (already deployed) |
| `services/donations.ts` | Donation orchestrator (401 fix, error msg fix) |

---

## Key Addresses

| Label | Value |
|-------|-------|
| **Pool Wallet** | `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk` |
| **Pool USDC ATA** | `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa` |
| **Mainnet USDC Mint** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| **Publisher Keypair** | `E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY` |
| **App ID** | `com.seekerdapp` |
| **Supabase Project** | `knvagydrbbvuumabmxcg` |
| **Contact Email** | `derrick@giveglimpse.com` |
