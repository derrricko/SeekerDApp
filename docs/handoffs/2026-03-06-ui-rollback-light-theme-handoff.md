# UI Rollback + Light Theme Lock Handoff

**Date:** 2026-03-06
**Branch:** `main`
**Base commit:** `a9d66f79` (`revert: undo proof-first redesign (7 commits)`)
**Status:** Local changes only, not committed

## Goal

Return the app closer to the earlier App Store-ready design, avoid late-stage redesign churn, keep the smaller 3-card onboarding, and remove dark theme behavior entirely so testing is deterministic.

## What Was Changed

### 1. Restored the older home screen

**File:** `screens/HomeScreen.tsx`

Replaced the newer 3-step strip / CTA home screen with the older App Store-era home:

- Restored the large `give` button
- Restored `GridBackground`
- Restored the pressed-state animation / shadow plate behavior
- Removed the strip-based onboarding visuals from the home screen

### 2. Kept the smaller onboarding flow

**File intentionally left as-is:** `screens/HowItWorksCarousel.tsx`

Important: the current carousel is already back to **3 steps**, not 6. No change was made there in this pass.

### 3. Removed runtime dark theme behavior

**Files:**

- `theme/Theme.tsx`
- `App.tsx`
- `screens/GiveScreen.tsx`
- `screens/MessagesScreen.tsx`

Changes made:

- `ThemeProvider` now returns the light theme only
- Removed `darkTheme`
- Removed `useColorScheme` and `system` / `dark` mode resolution
- `App.tsx` no longer passes `initialMode="dark"`
- Status bar changed to light-theme values:
  - `barStyle="dark-content"`
  - `backgroundColor="#EDE8FA"`
- Removed remaining `theme.mode` branches in Give and Messages
- Inputs that previously switched by theme now use the light surface directly

## Files Currently Modified Locally

Tracked local changes:

- `App.tsx`
- `screens/GiveScreen.tsx`
- `screens/HomeScreen.tsx`
- `screens/MessagesScreen.tsx`
- `theme/Theme.tsx`

There are also unrelated untracked docs in the worktree:

- `docs/handoffs/2026-03-05-proof-first-redesign-handoff.md`
- `docs/outreach/judge-tweets-monolith-2026.md`
- `docs/plans/2026-03-05-global-gtm-strategy-design.md`
- `docs/plans/2026-03-05-global-gtm-strategy.html`
- `docs/plans/2026-03-05-helius-full-integration-map.md`
- `docs/plans/2026-03-05-proof-first-redesign-design.md`
- `docs/plans/2026-03-05-proof-first-redesign-impl.md`

Do not revert those unless explicitly asked.

## Verification Already Performed

### TypeScript

Passed:

```bash
npx tsc --noEmit
```

### Tests

Passed with Watchman disabled:

```bash
npm test -- --watchAll=false --watchman=false
```

Result:

- 7 test suites passed
- 70 tests passed

### Device / App Reload

Performed on connected Android device:

- Verified device via `adb devices`
- Verified Metro on `127.0.0.1:8081`
- Ran `adb reverse tcp:8081 tcp:8081`
- Force-stopped and relaunched `com.seekerdapp`

The app was relaunched after:

1. restoring the old home screen
2. removing dark theme runtime behavior

## Important Notes

- These changes are **saved locally** in the working tree.
- They are **not committed** yet.
- No backend, edge function, Solana transaction, or Supabase schema code was changed in this pass.
- This was a UI rollback / runtime-theme cleanup only.

## Known Follow-Up

`eslint` is currently blocked by a local formatting issue in `theme/Theme.tsx` introduced during the light-only theme simplification. It is not a functional issue, but it should be cleaned up before commit.

Command that flagged it:

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0
```

## Recommended Next Steps For Claude

1. Visually confirm on device that:
   - the home screen is the older App Store-style `give` button version
   - no dark theme appears anywhere
   - the 3-card onboarding flow still behaves correctly
2. Fix the formatting issue in `theme/Theme.tsx`
3. Commit only the five tracked UI files if the visual result is approved

Suggested commit scope:

```bash
git add App.tsx screens/GiveScreen.tsx screens/HomeScreen.tsx screens/MessagesScreen.tsx theme/Theme.tsx
git commit -m "fix: restore app-store home screen and lock light theme"
```

