# Fix: Use signTransactions to Survive Activity Destruction

**Date:** 2026-03-02
**Status:** Design approved
**Goal:** Make USDC donations work on mainnet by moving tx submission out of the MWA session

## Root Cause

Android destroys and recreates the Activity when the MWA wallet bottom sheet closes (`singleTask` launchMode). The current code uses `signAndSendTransactions`, which asks the **wallet app** to submit the tx to the Solana network. If the MWA WebSocket session closes before the wallet returns the signature, `transact()` rejects with `ERROR_SESSION_CLOSED` — even though the wallet may have already submitted the tx.

## Fix

Replace `signAndSendTransactions` with `signTransactions` inside the `transact()` callback. `signTransactions` only signs — no network — so it completes near-instantly (pure crypto). The app then sends the signed tx itself, after the MWA session ends and the Activity is stable.

## New Flow

```
transact() callback (FAST — MWA-only, no network submission):
  1. authorize() → pubkey
  2. signMessages() → auth signature for wallet-auth
  3. buildTransaction(pubkey) → unsigned tx (includes RPC for blockhash, ATA checks)
  4. signTransactions([tx]) → signed tx (pure crypto, no network)
  5. Persist {wallet, authSig, message, signedTxBytes} to AsyncStorage (insurance)
  6. Return {pubkey, authSig, message, signedTx}

After transact() resolves (or on hydration after Activity recreation):
  7. connection.sendRawTransaction(signedTxBytes)  ← APP submits
  8. connection.confirmTransaction(...)
  9. POST /wallet-auth (authenticate session)
  10. POST /record-donation (record in backend, create conversation)
  11. Navigate to Messages
```

## Capability Check & Fallback

`signTransactions` is an optional MWA feature. Before using it:

```typescript
const caps = await wallet.getCapabilities();
const supportsSignTx = caps.features?.includes('solana:signTransactions');
```

If not supported: fall back to `signAndSendTransactions` with the same persist-before-kill pattern. The wallet returns the signature — persist it immediately — then complete remaining work.

## Files Changed

1. **`components/providers/WalletProvider.tsx`**
   - New `PENDING_DONATION_KEY` for persisting signed tx data
   - `authorizeAndSignAndSendTransaction` → use `signTransactions`, return signed tx
   - New `sendSignedTransaction()` exposed via context — sends persisted tx after session
   - Hydration effect handles pending donations (send tx on Activity recreation)

2. **`services/donations.ts`**
   - `executeDonationSeamless` → after wallet returns, call `sendRawTransaction` itself
   - Remove reliance on wallet-provided signature — extract from signed tx bytes

## Key Decisions

- **Transaction built inside transact()** — we need the pubkey from authorize() for ATA derivation and feePayer. RPC calls for blockhash/balance happen during the session but are to Solana RPC (not our backend), and they complete before the session closes.
- **Signed tx serialization** — `Transaction.serialize()` produces bytes that include the signature. `Transaction.from(bytes)` recovers the full signed tx. `bs58.encode(tx.signature)` gives the tx signature/id.
- **Pending donation recovery** — if Activity dies after signTransactions but before sendRawTransaction, the signed tx is in AsyncStorage. On hydration, we detect it and send.
- **Blockhash expiry** — signed tx includes a blockhash (~2 min validity). If Activity recreation takes > 2 min, the tx will be rejected. This is acceptable — user retries.

## Risk Notes

- `signTransactions` may not be supported by the Seeker wallet → fallback handles this
- Blockhash in signed tx expires after ~2 minutes → if Activity recreation is slow, tx fails
- We become responsible for tx submission retry logic (currently wallet handles this)
- Signed tx bytes in AsyncStorage = the user's signed authorization to send USDC. Must clear on disconnect.
