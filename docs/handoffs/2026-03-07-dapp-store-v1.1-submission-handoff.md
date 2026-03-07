# dApp Store v1.1 Submission Handoff

**Date:** 2026-03-07
**Author:** Codex
**Repo:** `/Users/derrickwoepking/Desktop/SeekerDApp`
**Branch:** `main`
**Head commit:** `a8c224f4655cb5db77179d828724d25b97f5c6bd`
**Pushed to GitHub:** Yes

---

## Executive Summary

The v1.1 update is prepared, built, validated, committed, and pushed.

The only blocker to completing the Solana dApp Store update is the publisher wallet balance. Release creation reached the on-chain mint/top-up step and failed because the publisher wallet has `0 SOL`.

If Claude has access to the funded publisher wallet or can fund the existing one, he should be able to finish the update quickly.

---

## What Codex Did

### 1. Confirmed current repo state

- Verified repo root: `/Users/derrickwoepking/Desktop/SeekerDApp`
- Verified branch: `main`
- Verified current commit after release prep: `a8c224f4655cb5db77179d828724d25b97f5c6bd`

### 2. Built the Android release APK

Command run:

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp/android
./gradlew assembleRelease
```

Result:

- `BUILD SUCCESSFUL`
- Output APK:
  - `/Users/derrickwoepking/Desktop/SeekerDApp/android/app/build/outputs/apk/release/app-release.apk`

### 3. Validated dApp Store metadata/package

Important detail:

- The dApp Store CLI expects to be run from the `dapp-store/` directory because it looks for `config.yaml` in the current working directory.
- Running from repo root fails with:
  - `ENOENT: no such file or directory, open '/Users/derrickwoepking/Desktop/SeekerDApp/config.yaml'`

Correct validation command:

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp/dapp-store
BUILD_TOOLS="$HOME/Library/Android/sdk/build-tools/34.0.0"
npx @solana-mobile/dapp-store-cli validate -k publisher-keypair.json -b "$BUILD_TOOLS"
```

Result:

- `Json is Valid`

### 4. Committed only release-relevant files

Committed files:

- `/Users/derrickwoepking/Desktop/SeekerDApp/android/app/build.gradle`
- `/Users/derrickwoepking/Desktop/SeekerDApp/dapp-store/config.yaml`
- `/Users/derrickwoepking/Desktop/SeekerDApp/data/donationConfig.ts`
- `/Users/derrickwoepking/Desktop/SeekerDApp/screens/GiveScreen.tsx`
- `/Users/derrickwoepking/Desktop/SeekerDApp/screens/MessagesScreen.tsx`
- `/Users/derrickwoepking/Desktop/SeekerDApp/services/donations.ts`
- `/Users/derrickwoepking/Desktop/SeekerDApp/supabase/functions/helius-webhook/index.ts`
- `/Users/derrickwoepking/Desktop/SeekerDApp/supabase/functions/record-donation/index.ts`

Commit created:

```bash
release: prepare dapp store v1.1 update
```

Commit hash:

- `a8c224f4655cb5db77179d828724d25b97f5c6bd`

### 5. Pushed the release commit

Command run:

```bash
git -C /Users/derrickwoepking/Desktop/SeekerDApp push origin main
```

Result:

- Push succeeded
- Remote updated from `1e866362` to `a8c224f4`

### 6. Attempted to create the new dApp Store release

Command run:

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp/dapp-store
BUILD_TOOLS="$HOME/Library/Android/sdk/build-tools/34.0.0"
npx dapp-store create release -k publisher-keypair.json -b "$BUILD_TOOLS" -u https://api.mainnet-beta.solana.com
```

Result:

- The CLI started correctly
- APK upload started
- Existing assets were detected and reused from Arweave
- Release creation failed at the wallet funding/top-up step because the publisher wallet has no SOL

Exact error:

```text
Failed to top up 233397213933 Winston Credits: Simulation failed.
Message: Transaction simulation failed: Attempt to debit an account but found no record of a prior credit.
```

---

## Publisher Wallet Blocker

Publisher wallet:

- `E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY`

Balance check command:

```bash
solana balance E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY --url https://api.mainnet-beta.solana.com
```

Result:

- `0 SOL`

Recommendation:

- Fund with `0.2 SOL` before retrying release creation

---

## Current dApp Store Metadata State

Config file:

- `/Users/derrickwoepking/Desktop/SeekerDApp/dapp-store/config.yaml`

Current release metadata includes:

- `android_details.version: '1.1'`
- `android_details.version_code: 2`
- `publisher.support_email` set
- mandatory banner included
- icon included
- 4 screenshots included
- APK install artifact points at:
  - `../android/app/build/outputs/apk/release/app-release.apk`

Current `new_in_version` text:

```text
Version 1.1 improves donation reliability, automatic thread opening, campaign copy, and message-thread polish.
```

---

## Assets Present

Files confirmed in `/Users/derrickwoepking/Desktop/SeekerDApp/dapp-store`:

- `config.yaml`
- `publisher-keypair.json`
- `icon-512.png`
- `banner-1200x600.png`
- `screenshots/01-campaigns.png`
- `screenshots/02-give-flow.png`
- `screenshots/03-confirmation.png`
- `screenshots/04-messages-thread.png`

Release APK confirmed:

- `/Users/derrickwoepking/Desktop/SeekerDApp/android/app/build/outputs/apk/release/app-release.apk`

Asset manifest already contains uploaded URIs:

- `/Users/derrickwoepking/Desktop/SeekerDApp/dapp-store/.asset-manifest.json`

This means the retry should not need to re-upload everything from scratch.

---

## Remaining Local Changes Not Included In Release Commit

These are still local-only and were intentionally left out of the release commit:

- `/Users/derrickwoepking/Desktop/SeekerDApp/STATUS.md`
- `/Users/derrickwoepking/Desktop/SeekerDApp/TODOS.md`
- untracked design/pitch/handoff docs under:
  - `/Users/derrickwoepking/Desktop/SeekerDApp/docs/design/`
  - `/Users/derrickwoepking/Desktop/SeekerDApp/docs/handoffs/`
  - `/Users/derrickwoepking/Desktop/SeekerDApp/docs/pitch/`
  - `/Users/derrickwoepking/Desktop/SeekerDApp/docs/plans/`

Do not sweep these into the dApp Store release commit by accident.

---

## If Claude Is Using A Different Keypair

If Claude plans to use a different funded wallet instead of the current `publisher-keypair.json`, he must verify:

1. It is the correct publisher wallet for the existing dApp Store publisher/app.
2. It is authorized to create the next release for the current app entry.
3. It matches the expected publisher/app ownership in the Solana dApp Store flow.

If that is not true, he should fund the current publisher wallet instead of swapping keys.

---

## Exact Next Commands For Claude

### 1. Verify publisher wallet balance

```bash
solana balance E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY --url https://api.mainnet-beta.solana.com
```

### 2. Re-run release creation after funding

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp/dapp-store
BUILD_TOOLS="$HOME/Library/Android/sdk/build-tools/34.0.0"
npx dapp-store create release -k publisher-keypair.json -b "$BUILD_TOOLS" -u https://api.mainnet-beta.solana.com
```

### 3. Submit the update

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp/dapp-store
npx dapp-store publish submit -k publisher-keypair.json -u https://api.mainnet-beta.solana.com --requestor-is-authorized --complies-with-solana-dapp-store-policies
```

---

## Notes For Claude

- The code push is already done. There is no need to rebuild or recommit unless something changed after `a8c224f4`.
- Validation already passed, so if submission fails after funding, it is likely wallet/publisher authorization related, not metadata formatting.
- The release creation failure was not caused by missing assets or bad config.
- The main thing to avoid is changing the wrong wallet/keypair and accidentally drifting from the existing publisher/app setup.
