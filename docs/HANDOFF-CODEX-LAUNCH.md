# Handoff: Mainnet Launch Ops (Truth-Aligned)

**Branch:** `v2/mainnet-launch`
**Commit:** `ff6b5f78` (as of 2026-02-28)
**Owner split:** Codex = launch ops + config/docs consistency. Derrick = device actions + wallet funds.

## North Star
Ship one real path on mainnet:
`open app -> donate USDC -> confirm/sign in wallet -> on-chain confirmation -> message thread opens`.

If this works once on a release build on Seeker, launch is viable.

---

## Source-of-Truth Product Behavior (must match listing + tests)

- Donation currency: **USDC only**.
- Wallet auth/sign happens at **Confirm and Sign** stage (no separate connect step in Give flow).
- Campaign minimums are enforced in app:
  - `Supplies for public school teachers` = **10 USDC**
  - `Support for single moms and families in crisis` = **25 USDC**
  - `Foster care after school programs, diapers and formula` = **15 USDC**
- Messages thread opens immediately after successful donation flow.
- Timeline copy in app:
  - 24-48h: outreach with specific need match
  - 5-7 days: receipts, photos, progress updates

---

## What Is Already Done

- Mainnet-oriented backend/schema hardening is in place (including migration 008).
- `record-donation` flow hardened and deployed.
- Quality gates previously reported green (tsc/eslint/jest/bundle).

Note: This document focuses on the final launch operations and consistency checks.

---

## Launch Ops Plan (Codex-run)

## Step A: Preflight verification (no assumptions)

Run from repo root:

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp
git branch --show-current
git rev-parse --short HEAD
```

Expected:
- Branch = `v2/mainnet-launch`
- Commit matches or intentionally differs from `ff6b5f78`

Verify package/app ID alignment:

```bash
rg -n "applicationId|namespace" android/app/build.gradle
```

Expected:
- `applicationId "com.seekerdapp"`
- `namespace "com.seekerdapp"`

## Step B: Truth-align dApp Store listing text

Current listing text must not claim unsupported flow.

Required edits before submit:
- Remove “any amount from $0.01” claims.
- Remove “choose causes first” wording if donation form is campaign-first.
- Replace “connect wallet” as a first step with “confirm and sign in wallet”.

Files to align:
- `docs/dapp-store-listing-copy.md`
- `dapp-store/config.yaml` (`release.catalog.en.long_description`, `new_in_version`)

Use this truth-aligned flow text:

1. Open Give
2. Enter USDC amount and choose campaign
3. Add optional context/note
4. Review donation details
5. Confirm and sign in wallet
6. Follow updates in your message thread

## Step C: Host privacy policy and wire URL

Source file:
- `docs/privacy-policy.html`

Host at one stable public URL (example target):
- `https://giveglimpse.com/privacy`

Then update all three URLs in `dapp-store/config.yaml`:
- `license_url`
- `privacy_policy_url`
- `copyright_url`

## Step D: Validate dApp Store asset/config completeness

Required files must exist:
- `dapp-store/icon-512.png`
- `dapp-store/screenshots/01-campaigns.png`
- `dapp-store/screenshots/02-give-flow.png`
- `dapp-store/screenshots/03-confirmation.png`
- `dapp-store/screenshots/04-messages.png`

Quick check:

```bash
ls -la dapp-store/icon-512.png dapp-store/screenshots/*.png
```

Also fill this field if still blank:
- `solana_mobile_dapp_publisher_portal.google_store_package` in `dapp-store/config.yaml`

Recommended value:
- `com.seekerdapp`

## Step E: dApp Store CLI usage without mutating dependencies

Prefer `npx` over `npm install --save-dev` during launch ops.

Detect build-tools path:

```bash
BUILD_TOOLS="$HOME/Library/Android/sdk/build-tools/34.0.0"
if [ ! -d "$BUILD_TOOLS" ]; then
  BUILD_TOOLS="$HOME/Library/Android/sdk/build-tools/$(ls -1 "$HOME/Library/Android/sdk/build-tools" | sort -V | tail -n1)"
fi
echo "$BUILD_TOOLS"
```

Validate config:

```bash
npx dapp-store validate -k dapp-store/publisher-keypair.json -b "$BUILD_TOOLS"
```

Publisher/App/Release + submit:

```bash
npx dapp-store create publisher -k dapp-store/publisher-keypair.json -u https://api.mainnet-beta.solana.com
npx dapp-store create app -k dapp-store/publisher-keypair.json -u https://api.mainnet-beta.solana.com
npx dapp-store create release -k dapp-store/publisher-keypair.json -b "$BUILD_TOOLS" -u https://api.mainnet-beta.solana.com
npx dapp-store publish submit -k dapp-store/publisher-keypair.json -u https://api.mainnet-beta.solana.com --requestor-is-authorized --complies-with-solana-dapp-store-policies
```

---

## Manual Device Plan (Derrick)

1. Build release APK:

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp/android
./gradlew assembleRelease
cd ..
```

2. Install release APK on Seeker:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

3. Fund test wallet for one real donation:
- SOL for fees
- USDC for donation

4. Run one true E2E donation using a valid minimum:
- Recommended test case:
  - Campaign: `Supplies for public school teachers`
  - Amount: **10.00 USDC**

5. Verify all three outcomes:
- On-chain tx confirmed (SPL transfer + memo)
- Supabase donation + conversation rows created
- Messages thread opens in app

6. Capture release screenshots (1080x1920) for store assets.

---

## Launch Gates (hard go/no-go)

- Gate 1: Listing copy matches real app behavior.
- Gate 2: Privacy policy URL is public and stable.
- Gate 3: Release APK installs and runs on Seeker.
- Gate 4: One real mainnet USDC donation succeeds at campaign minimum.
- Gate 5: Donation recorded server-side and message thread auto-opens.
- Gate 6: dApp Store validate passes with final assets.
- Gate 7: Submit command returns success.

If any gate fails, do not submit. Fix and retest.

---

## Key Files

- `docs/HANDOFF-CODEX-LAUNCH.md` (this file)
- `docs/MONDAY-LAUNCH-RUNSHEET.md`
- `docs/dapp-store-listing-copy.md`
- `docs/privacy-policy.html`
- `dapp-store/config.yaml`
- `dapp-store/publisher-keypair.json` (gitignored)
- `supabase/migrations/008_v2_usdc_only_schema_fix.sql`

## Key Addresses

- Pool Wallet: `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk`
- Pool USDC ATA: `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa`
- Mainnet USDC Mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Publisher Keypair Address: `E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY`
- Android Package: `com.seekerdapp`
- Supabase Project: `knvagydrbbvuumabmxcg`
- Contact: `derrick@giveglimpse.com`
