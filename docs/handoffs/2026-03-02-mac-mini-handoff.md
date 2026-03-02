# Mac Mini Handoff — 2026-03-02

## What Just Happened

Replaced `signAndSendTransactions` with `signTransactions` in the MWA wallet flow to survive Android Activity destruction on Seeker. The wallet now only **signs** inside `transact()` — the app submits the tx itself after the session closes.

### Root Cause

Android destroys/recreates the Activity when the MWA wallet bottom sheet closes (`singleTask` launchMode). `signAndSendTransactions` asks the wallet to submit to Solana — if the session closes before the signature returns, the donation fails with "Could not complete wallet transaction."

### Fix (Two-Phase Flow)

| Phase | Where | What happens |
|---|---|---|
| **1 — MWA** | Inside `transact()` | authorize → signMessages → buildTx → **signTransactions** (no network) |
| **2 — App** | After `transact()` | sendRawTransaction → confirmTransaction → wallet-auth → record-donation |

Fallback: if `signTransactions` isn't supported (checked via `getCapabilities()`), falls back to `signAndSendTransactions`.

## Uncommitted Changes

All changes are **uncommitted on `main`**. Nothing has been pushed.

### Modified Files (the important ones)

| File | What changed |
|---|---|
| `components/providers/WalletProvider.tsx` | **Core change.** `authorizeAndSignAndSendTransaction` → `authorizeSignAndBuildTransaction`. Uses `signTransactions` with fallback. Persists signed tx to AsyncStorage. Clears on disconnect. |
| `services/donations.ts` | `executeDonationSeamless` now receives signed tx, calls `sendRawTransaction` itself. Handles fallback path. Avoids duplicate wallet-auth calls. |
| `screens/GiveScreen.tsx` | Updated to use renamed method (`authorizeSignAndBuildTransaction`). |
| `docs/plans/2026-03-02-sign-transactions-fix-design.md` | Full design doc for the fix. |

### Other uncommitted files (from earlier sessions)

| File | Context |
|---|---|
| `config/env.ts` | May have cluster/RPC changes |
| `data/donationConfig.ts` | Campaign options updates |
| `navigation/AppNavigator.tsx` | **SGT gating BYPASSED** — re-enable before mainnet |
| `screens/CampaignsScreen.tsx` | Mock data for testing |
| `supabase/functions/record-donation/index.ts` | Edge function updates |
| `supabase/migrations/013_v2_drop_legacy_tables.sql` | New migration |
| `docs/plans/2026-03-02-mwa-activity-lifecycle-fix.md` | Earlier debug session notes |

## Quality Gates (All Pass)

```
npx tsc --noEmit                    → clean
npm test -- --watchAll=false        → 66/66 pass
npx react-native bundle ...         → builds clean
```

## What To Do Next

1. **Commit the changes** — suggest one commit for the signTransactions fix, one for other uncommitted work
2. **Build debug APK** — `npx react-native run-android` (connect Seeker via USB)
3. **Test the donation flow on device** — the key test:
   - Open Give tab → enter amount → select campaign → Review → Confirm and Sign
   - Wallet bottom sheet should open → approve → bottom sheet closes
   - App should submit the tx itself → confirm → record → navigate to Messages
4. **Watch logcat** — `adb logcat | grep -i "glimpse\|signTransactions\|sendRaw"`
5. **If signTransactions works:** The primary path succeeded — wallet signed, app submitted
6. **If signTransactions fails:** Check logcat for "falling back to signAndSendTransactions" — the fallback path kicks in automatically

## Known Issues / Flags

- **SGT gating is BYPASSED** in `navigation/AppNavigator.tsx` — re-enable before mainnet launch
- **Mock data** in CampaignsScreen + MessagesScreen — remove before mainnet
- **Hydration gap** — if Activity dies after signTransactions but before sendRawTransaction, the signed tx is in AsyncStorage but only recovered on the next donation attempt (not on cold start). Acceptable for launch — user retries.
- **Blockhash expiry** — signed tx has ~2 min validity. If Activity recreation takes longer, tx fails and user retries.
- **Double wallet-auth** protection — donations.ts checks `getSupabaseAccessToken()` before calling wallet-auth to avoid replay guard rejection.

## Key Addresses

| What | Address |
|---|---|
| Pool wallet | `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk` |
| Mainnet USDC ATA | `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa` |
| USDC mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Supabase | `https://knvagydrbbvuumabmxcg.supabase.co` |

## Build Commands

```bash
# Quality gates
npx tsc --noEmit
npm test -- --watchAll=false
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle

# Debug APK to device
npx react-native run-android

# Release APK
cd android && ./gradlew assembleRelease
```
