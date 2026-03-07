# Submitted APK vs Current Codebase

**Date:** 2026-03-06  
**Current branch:** `main`  
**Current HEAD used for comparison:** `b263c20a`  
**Submitted APK baseline used for comparison:** `4189aa11` (`feat: dApp Store submitted — app + release NFTs minted on mainnet`)

## Scope and Assumption

There is no archived copy of the exact submitted APK binary tracked in git.

So this comparison uses:

- the **submission commit** `4189aa11` as the source baseline
- the dApp Store metadata in `dapp-store/config.yaml`
- the **current committed codebase** at `b263c20a`

This is the most reliable source-based comparison of "the APK you submitted" vs "what the app would do if you built the current code today."

Important: there are two untracked local docs files in the worktree right now:

- `docs/design/pitch-deck-monolith-2026-v2.html`
- `docs/plans/2026-03-05-global-gtm-strategy-print.html`

Those are not APK/runtime changes and are not included in this comparison.

## Submitted APK Release Metadata

From `dapp-store/config.yaml`:

- Android package: `com.seekerdapp`
- Version name: `1.0`
- Version code: `1`
- Submitted release address: `F6uhmhv27PstFHkzymPKQ53DFGFuUSigPpZNNrHtxe4h`
- Submitted APK hash: `RALkdAkvoYySB2XucX8bhF1YHtcKuDH08L7+oMeJzhI=`

## High-Level Summary

The current codebase is **closer to the submitted APK than the commit history first suggests**.

Why:

- the large proof-first redesign was added after submission
- then that redesign was reverted
- then the home screen and light-theme behavior were restored again

So the current app is **not** the full redesign version.

The biggest real differences now are:

1. The app now uses **Helius** for reads and verification instead of the public mainnet RPC.
2. The Glimpses feed now includes **verified on-chain enhancements** and explorer links.
3. The onboarding carousel changed from **6 cards to 3 cards**.
4. There is now a **server-side Helius webhook fallback** for recording donations.
5. The codebase is now **locked to light theme** and no longer carries runtime dark-theme switching.

## What Did Not Change

These are effectively the same between the submitted APK baseline and the current codebase:

- Android package name is still `com.seekerdapp`
- Android version is still `versionCode 1`, `versionName 1.0`
- `android/app/build.gradle` is unchanged
- `android/app/src/main/AndroidManifest.xml` is unchanged
- `screens/HomeScreen.tsx` is back to the older App Store-style `give` button home screen
- the core wallet/auth flow is materially the same
- `wallet-auth` and `record-donation` edge functions are unchanged from the submitted baseline

## APK-Relevant Differences

### 1. RPC / Networking Layer

**Changed file:** `config/env.ts`

Submitted APK:

- used public mainnet RPC: `https://api.mainnet-beta.solana.com`

Current codebase:

- uses Helius mainnet RPC
- includes a client-side `HELIUS_API_KEY`

Practical effect:

- faster reads
- less public RPC rate-limit pain
- but more dependence on Helius for feed/read behavior

### 2. Feed / Glimpses Screen

**Changed files:**

- `screens/CampaignsScreen.tsx`
- `services/helius.ts` (new)
- `data/donationConfig.ts`

Current codebase adds:

- enhanced transaction lookups via Helius
- verified on-chain badge logic in the feed
- explorer links from donation cards
- safer per-wallet donation history cache behavior
- `general` recipient label support for webhook fallback rows

Practical effect:

- the feed is more informative than the submitted APK
- users can see verification context and jump to explorer
- donation history handling is more reliable across wallet switches

### 3. Onboarding / How It Works

**Changed file:** `screens/HowItWorksCarousel.tsx`

Submitted APK:

- 6-step onboarding
- more illustrative, screen-by-screen explainer style

Current codebase:

- 3-step onboarding
- shorter, more copy-driven sequence
- simpler "Give / Confirm / See Proof" framing

Practical effect:

- current onboarding is faster and simpler
- current version is less exhaustive than the submitted version

### 4. Give Flow

**Changed file:** `screens/GiveScreen.tsx`

Differences from submitted APK are small:

- better user-safe copy when on-chain donation succeeds but thread creation is delayed
- added explicit note about Solana network fees in the review timeline
- input surface now hardcodes the light input background

Practical effect:

- current build gives slightly better donation-state messaging
- no major flow rewrite relative to the submitted APK

### 5. Messages / Unread Behavior

**Changed files:**

- `screens/MessagesScreen.tsx`
- `services/chat.ts`

Current codebase adds:

- better unread handling for unrelated realtime inserts
- refresh fallback when a new conversation appears that is not already in unread state
- light-only text/input color paths

Practical effect:

- current messaging behavior should be more stable than the submitted APK
- UI differences here are minor; reliability differences matter more than visuals

### 6. Theme Behavior

**Changed files:**

- `theme/Theme.tsx`
- `App.tsx`
- `screens/GiveScreen.tsx`
- `screens/MessagesScreen.tsx`

Submitted APK:

- already used light mode by default
- still carried runtime theme infrastructure

Current codebase:

- removes runtime dark/system theme switching entirely
- always returns the light theme
- status bar remains light-theme aligned

Practical effect:

- current build is more deterministic for testing
- dark-mode behavior is removed rather than merely defaulted away

### 7. Backend Fallback Recording

**Changed file:** `supabase/functions/helius-webhook/index.ts` (new)

Submitted APK era:

- donation recording depended on the client path

Current codebase:

- adds Helius webhook fallback
- auto-records incoming Glimpse donations server-side
- creates conversation + welcome message when possible
- uses `recipient_id: 'general'` and empty causes when full campaign context is unavailable

Practical effect:

- better resilience when the client path fails after on-chain success
- current system is more fault-tolerant than the submitted APK era

### 8. Dependency / Tooling Difference

**Changed file:** `package.json`

Current codebase adds:

- `@solana-mobile/dapp-store-cli`

Practical effect:

- release tooling improvement only
- no user-facing runtime app change by itself

## Commit Timeline That Actually Matters

These are the meaningful APK/runtime changes after the submission commit:

- `026ceea9` — campaign feed and give screen updates
- `2e345d88` — added How It Works page / onboarding work
- `bbda078f` — Helius integration: enhanced feed + webhook auto-recording
- `f6d85e0a` — hardened wallet history, unread badges, webhook metadata
- `68b24ddf` through `4128b4b4` — redesign/polish work
- `a9d66f79` — reverted the large proof-first redesign
- `ff42a037` — restored App Store-style home screen and locked light theme

Important interpretation:

The redesign commits happened, but most of that visual shift **does not survive** in the current codebase because it was reverted and then further normalized.

## What the Current Build Would Feel Like Compared to the Submitted APK

If you built the current code today, compared to the APK you submitted, the app would likely feel like:

- the **same product identity**
- the **same Android package / same release version metadata**
- the **same older home screen look**
- but with:
  - a shorter 3-card onboarding flow
  - better feed verification and explorer visibility
  - Helius-powered reads
  - a webhook fallback for recording donations
  - better unread/message reliability
  - no dark theme behavior

## Important Release Note

Because `android/app/build.gradle` is unchanged, the current codebase still reports:

- `versionCode 1`
- `versionName 1.0`

So if you want to ship the current code as a new dApp Store/Android release, you must treat it as a **new build** but not yet a **new versioned release**.

In other words:

- behavior has changed
- version metadata has not

## Bottom Line

The current codebase is **not wildly different** from the submitted APK anymore.

The biggest surviving differences are:

1. Helius-powered feed verification
2. Helius webhook fallback recording
3. 3-card onboarding instead of 6-card onboarding
4. light-theme-only runtime behavior
5. small Give/Messages reliability and copy improvements

The biggest things that are **the same**:

1. package / native Android identity
2. version metadata
3. core wallet/donation architecture
4. older App Store-style home screen

