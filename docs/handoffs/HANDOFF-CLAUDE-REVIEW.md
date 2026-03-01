# Handoff for Claude Review

Date: 2026-02-27  
Repo: `SeekerDApp`  
Branch: `v2/give-portal`  
Status: Local changes are complete and tested, but not committed/pushed in this pass.

## Goal of This Pass

Build a clean v2 loop focused on:

1. Donate flow
2. Immediate handoff into messaging
3. Faster campaign/message navigation
4. Minimal-risk backend support for cadence/stage metadata

## Files Changed

- `navigation/AppNavigator.tsx`
- `screens/CampaignsScreen.tsx`
- `screens/GiveScreen.tsx`
- `screens/HowItWorksCarousel.tsx`
- `screens/MessagesScreen.tsx`
- `services/donations.ts`
- `utils/transfer.ts`
- `supabase/functions/record-donation/index.ts`
- `supabase/migrations/004_v2_donation_cadence_and_stage.sql` (new)
- `STATUS.md`
- `CLAUDE.md`

## What Was Implemented

### 1) Navigation + Donate Entry

- Tab flow was hardened around `Glimpses`, `Give`, `Messages`, `Rank`.
- Center `DONATE` path remains the main action.
- `HowItWorksCarousel` now supports an `onComplete` callback so final step can route directly into Give.

### 2) Give Flow Upgrade

- Donation amount parsing/validation improved (`0 < amount <= 100`, comma-safe parsing).
- Cadence (`one_time` or `daily`) is passed through the flow.
- Post-success actions added:
  - `Open Thread` (deep-link to conversation in Messages)
  - `My Glimpses` (return to campaigns/glimpses)

### 3) Campaigns to Messages Handoff

- Campaign list rows can route to Messages.
- Messages accepts optional `conversationId` route param.
- Messages auto-opens selected thread and refreshes on focus.

### 4) Donation Service + Memo Schema

- `services/donations.ts` now forwards cadence.
- `utils/transfer.ts` memo payload extended with cadence field:
  - `c: "one_time" | "daily"`

### 5) Server Recording Function

- `record-donation` edge function now reads cadence from memo and attempts to persist it.
- Backward compatibility path included:
  - If cadence column is missing (older DB), retries insert without cadence so donation recording still works.
- Welcome message logic now cadence-aware for daily donors.

### 6) Database Migration

New migration: `supabase/migrations/004_v2_donation_cadence_and_stage.sql`

- Adds `donations.cadence` with default `one_time`
- Adds `donations.impact_stage` with default `processing`
- Adds index on `impact_stage`

## Validation Run

Executed locally and passing:

- `npm run lint -- --max-warnings=0`
- `npx tsc --noEmit`
- `npm test -- --watch=false --watchman=false`

## What Claude Should Review Closely

1. Route param typing and navigation safety around `conversationId`.
2. Give success path correctness (`Open Thread` and tab transitions).
3. Memo schema compatibility between app-side and edge function parsing.
4. Edge function fallback behavior when migration 004 is not yet deployed.
5. RLS assumptions for conversation/message read paths after donation creation.

## To Run the App Right Now (Device or Emulator)

Use two terminal windows.

### Terminal 1 (Metro)

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp
npm start -- --reset-cache
```

### Terminal 2 (Android app)

```bash
cd /Users/derrickwoepking/Desktop/SeekerDApp
adb devices
adb reverse tcp:8081 tcp:8081
npx react-native run-android
```

If you hit signature mismatch (`INSTALL_FAILED_UPDATE_INCOMPATIBLE`):

```bash
adb uninstall com.seekerdapp
npx react-native run-android
```

## Deployment Reminder (Backend)

To use cadence/stage in production behavior, migration 004 must be applied in Supabase before relying on those fields.
