# MWA Activity Lifecycle Fix — Paused Work

## Root Cause (Confirmed via logcat + AsyncStorage breadcrumbs)

Android destroys and recreates the Glimpse Activity when the Seen wallet's `MWABottomSheetActivity` closes (singleTask launchMode behavior). The `transact()` callback **does execute** — authorize() and signMessages() both succeed — but the HTTP call to `wallet-auth` edge function gets killed when the Activity is destroyed.

### Evidence

1. **Logcat** shows `MobileWalletAdapterSessionCommon: session closed` followed by `Window{a7da068 MainActivity EXITING} → Window{6b53153 MainActivity}` (new Activity instance).
2. **AsyncStorage breadcrumb** trail stopped at `calling_wallet_auth` — the last write before the HTTP call to Supabase.
3. `singleTop` launchMode did not fix it (official MWA example uses `singleTask`).

### Timeline from logcat (13:33:xx)

```
:12  — MWA bottom sheet + seed vault active (biometric approval)
:15  — seedvaultimpl PAUSED, MWABottomSheetActivity RESUMED
:16.122 — "mobile-wallet-adapter session closed" (wallet side)
:16.123 — "session closed" (our app side) + WebSocket server stops
:16.153 — Focus returns to seekerdapp MainActivity
:17.094 — OLD MainActivity window disposed (EXITING)
:17.097 — NEW MainActivity window takes focus
```

### Solution (implemented but not yet working)

**Pending Auth Pattern** — persist signature + message to AsyncStorage before the HTTP call, complete on hydration:

```
transact() callback:
  1. authorize() → save wallet address
  2. signMessages() → save {wallet, signature, message} as pending auth
  3. HTTP call starts (may get killed)

On mount (hydration effect):
  1. Check for pending auth in AsyncStorage
  2. If found → complete HTTP call to wallet-auth → restore session
  3. If not found → check for existing JWT + address → restore session
```

This is implemented in `WalletProvider.tsx` with `PENDING_AUTH_KEY = '@glimpse_pending_auth'`. The `completePendingAuth()` helper function handles the deferred HTTP call.

### Why hydration didn't work

Unknown. Possible causes:
- The hydration effect runs but `completePendingAuth()` fails (5-min challenge window expired? replay guard?)
- The pending auth JSON never actually persists (AsyncStorage write killed before flush)
- The Activity recreation happens before our process gets a chance to write
- React Native re-mounts with a fresh JS context that doesn't trigger the effect

### Next Steps

1. **Build a debug APK** (not release) so we can use `adb run-as` to inspect AsyncStorage directly
2. **Add a visible on-screen debug panel** (not Alert) that shows pending auth status on every render
3. **Test the 5-min auth challenge window** — if the Activity recreation + hydration takes > 5 min total, the challenge will be rejected by the edge function
4. **Consider alternative approaches:**
   - Use `auth_token` from MWA authorize result to skip re-auth on reconnect
   - Move wallet-auth call OUT of the transact callback entirely
   - Use Android foreground service to keep the process alive during MWA
   - Switch to `@wallet-ui/react-native-web3js` MobileWalletProvider (newer SDK)

### Files Modified

- `android/app/src/main/AndroidManifest.xml` — tried singleTop, reverted to singleTask
- `components/providers/WalletProvider.tsx` — pending auth pattern + hydration
- `navigation/AppNavigator.tsx` — SGT loading state for gated screens
- `screens/SeekerRequiredScreen.tsx` — debug alerts (removed)
- `utils/sgt.ts` — console.error cleanup (kept)

### Key Addresses

- Pool wallet: `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk`
- Mainnet USDC ATA: `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa`
- USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
