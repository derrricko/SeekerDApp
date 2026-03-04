# Hackathon Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute the 4-day hackathon sprint: verify deployment, build pitch assets, run outreach, and optionally add SKR "Buy a Seeker" integration.

**Architecture:** Day 1 is verification (edge functions, privacy URL, on-device flow). Day 4 adds a new campaign option to GiveScreen + record-donation edge function for SKR. Everything else is non-code (deck, video, outreach).

**Tech Stack:** React Native, Supabase Edge Functions (Deno), TypeScript, Solana SPL Token

---

### Task 1: Verify edge functions are deployed

**Files:**
- Reference: `supabase/functions/wallet-auth/index.ts`
- Reference: `supabase/functions/record-donation/index.ts`

**Step 1: Deploy both edge functions**

Run: `npx supabase functions deploy wallet-auth && npx supabase functions deploy record-donation`
Expected: Both deploy successfully with no errors

**Step 2: Verify wallet-auth responds**

Run: `curl -s -o /dev/null -w "%{http_code}" https://knvagydrbbvuumabmxcg.supabase.co/functions/v1/wallet-auth`
Expected: `405` (Method Not Allowed — confirms the function is live, rejects GET)

**Step 3: Verify record-donation responds**

Run: `curl -s -o /dev/null -w "%{http_code}" https://knvagydrbbvuumabmxcg.supabase.co/functions/v1/record-donation`
Expected: `405` (same — live, rejects GET)

---

### Task 2: Verify privacy policy is live

**Step 1: Check the URL**

Run: `curl -s -o /dev/null -w "%{http_code}" https://giveglimpse.com/privacy`
Expected: `200`

**Step 2: If 404 or error, check GitHub Pages deployment**

Run: `curl -s https://giveglimpse.com/privacy | head -20`
Expected: HTML containing privacy policy content

**Step 3: If down — fix**

The privacy policy source is at `docs/launch/privacy-policy.html`. Push to the `giveglimpse-site` repo on GitHub Pages.

---

### Task 3: Verify mainnet config consistency

**Files:**
- Check: `config/env.ts`

**Step 1: Confirm cluster is mainnet-beta**

Read `config/env.ts` and verify:
- `SOLANA_CLUSTER` = `'mainnet-beta'`
- `USDC_MINT` = `'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'`
- `MATCHING_POOL_WALLET` = `'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk'`
- Supabase anon key is the rotated key from 2026-03-02

Expected: All values match. No action needed unless drift found.

---

### Task 4: Bundle check (verify app compiles)

**Step 1: Run Metro bundler check**

Run: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle`
Expected: Bundle output success, no errors

**Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

---

### Task 5: SKR "Buy a Seeker" campaign option (Day 4 — if time)

**Files:**
- Modify: `data/donationConfig.ts:30-58` (add campaign option)
- Modify: `supabase/functions/record-donation/index.ts:52-84` (add campaign rule + cause prefs)

**Step 1: Add "Buy a Seeker" to CAMPAIGN_OPTIONS**

In `data/donationConfig.ts`, add a 4th campaign to the `CAMPAIGN_OPTIONS` array after `foster-care-after-school`:

```typescript
  {
    id: 'buy-seeker',
    label: 'Buy a Seeker',
    glimpseTag: '#004',
    summary:
      'Buy a Solana Seeker phone for a Glimpse partner. Earn 2x points. The device goes directly to someone in need.',
    causePreferences: ['seeker-device', 'skr-bonus'],
    minimumUSDC: 200,
  },
```

**Step 2: Add campaign rule to edge function**

In `supabase/functions/record-donation/index.ts`, add to the `CampaignId` type union (line 52):

```typescript
type CampaignId =
  | 'public-schools'
  | 'single-moms-crisis'
  | 'foster-care-after-school'
  | 'buy-seeker';
```

Add to the `CAMPAIGN_RULES` array (after line 79):

```typescript
  {
    id: 'buy-seeker',
    minimumUSDC: 200,
    causePreferences: ['seeker-device', 'skr-bonus'],
  },
```

**Step 3: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: Clean (0 errors)

**Step 4: Run bundle check**

Run: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle`
Expected: Success

**Step 5: Deploy updated edge function**

Run: `npx supabase functions deploy record-donation`
Expected: Deploy success

**Step 6: Build release APK**

Run: `cd android && ./gradlew assembleRelease`
Expected: BUILD SUCCESSFUL, new APK at `android/app/build/outputs/apk/release/app-release.apk`

**Step 7: Commit**

```bash
git add data/donationConfig.ts supabase/functions/record-donation/index.ts
git commit -m "feat: add Buy a Seeker campaign for SKR integration"
```

---

### Task 6: Update dApp Store listing for SKR (only if Task 5 succeeds)

**Files:**
- Modify: `dapp-store/config.yaml` (update long_description to mention SKR)

**Step 1: Add SKR mention to long_description**

Add one line to the feature list in `config.yaml` long_description:

```
Buy a Seeker — donate USDC to put a Solana Seeker device directly in the hands of a Glimpse partner. Earn 2x points.
```

**Step 2: Rebuild release APK (versionCode stays at 1 unless store requires bump)**

Run: `cd android && ./gradlew assembleRelease`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add dapp-store/config.yaml
git commit -m "chore: update dApp Store listing with SKR integration"
```

---

## Non-Code Tasks (Reference Only)

These are tracked in the design doc at `docs/plans/2026-03-03-hackathon-sprint-design.md`:

- **Day 2:** Build pitch deck (10 slides), record demo video (2-3 min)
- **Day 3:** Outreach Wave 1 (12 Tier 1 leads) + Wave 2 (15 Tier 2 leads) + dApp builder DMs
- **Day 4:** Outreach Wave 3 + public X post + deck lockdown
- **Day 5 (Sat):** Submit to hackathon portal

Community leads list: `docs/outreach/seeker-community-2026-03-02.md`

---

## Execution Order

| Task | Day | Depends On | Cut If... |
|------|-----|------------|-----------|
| 1. Deploy edge functions | Day 1 | — | Never cut |
| 2. Verify privacy URL | Day 1 | — | Never cut |
| 3. Verify mainnet config | Day 1 | — | Never cut |
| 4. Bundle check | Day 1 | — | Never cut |
| 5. SKR campaign option | Day 4 | Tasks 1-4 | Not clean by noon |
| 6. Update dApp Store listing | Day 4 | Task 5 | Task 5 cut |
