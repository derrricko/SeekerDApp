# Manual Test Plan — Pre-Mainnet

**Date:** 2026-03-01
**Branch:** `v2/mainnet-launch`
**Device:** Solana Seeker
**Goal:** Validate the full donation flow end-to-end before taking real USDC on mainnet.

---

## Pre-Flight

- [ ] Clear Metro cache: `npx react-native start --reset-cache`
- [ ] Fresh install on device: `npx react-native run-android`
- [ ] Confirm `config/env.ts` points to the right cluster
- [ ] Confirm edge functions are deployed: `npx supabase functions list`
- [x] Verify Helius API key was rotated (2026-03-03)

---

## 1. Wallet Connect

- [ ] Cold start → tap DONATE → MWA authorize prompt appears
- [ ] Approve wallet connection → app returns to Give screen with wallet connected
- [ ] Kill app → reopen → wallet session is restored (JWT hydration from AsyncStorage)
- [ ] Reject wallet connection → appropriate state shown, no crash
- [ ] Multiple wallet apps installed → chooser appears, both work
- [ ] MWA address format → verify base64 and base58 both parse correctly on Seeker

---

## 2. Donation Flow (Happy Path)

- [ ] Select a campaign → enter amount (minimum or above) → proceed to confirm
- [ ] Confirm screen shows correct amount, campaign, and 2-line timeline
- [ ] Tap "Confirm and Sign" → MWA sign prompt appears
- [ ] Approve → processing screen shows with amount in accent color
- [ ] Processing screen shows "DONATION CONFIRMED" with explorer link
- [ ] Tap explorer link → Solana Explorer → tx exists with correct USDC transfer + memo
- [ ] Tap Done → returns to Give form (reset state)
- [ ] Verify memo fields: `d`, `r`, `a`, `t`, `app:"glimpse"`, `tok:"usdc"`, `c` (cadence)

### Amount Boundaries
- [ ] Enter 0 USDC → rejected
- [ ] Enter below campaign minimum → rejected with clear message
- [ ] Enter 10,000 USDC (max) → accepted
- [ ] Enter 10,001 USDC → rejected
- [ ] Enter 0.000001 USDC → verify precision is preserved through the chain

### Form Validation
- [ ] Select 0 causes → blocked from proceeding
- [ ] Select 3 causes (max) → accepted
- [ ] Attempt 4 causes → prevented
- [ ] Verify cadence (one_time vs daily) appears in memo `c` field and Supabase row
- [ ] Verify donation_mode (solo vs group) stored correctly

---

## 3. Backend Recording

- [ ] After donation confirms, check Supabase `donations` table → new row exists
- [ ] Row has correct: `amount_usdc`, `donor_wallet`, `tx_signature`, `hold_status`
- [ ] `conversations` table has new row linked to the donation
- [ ] `messages` table has welcome message: "Next steps: Your donation of X USDC..."
- [ ] Call `record-donation` twice with the same signature → idempotent (no duplicate row, no doubled amount)

### Retry Queue
- [ ] If backend recording fails, check AsyncStorage for queued retry entry
- [ ] Reopen app after failed recording → retry fires → conversation appears
- [ ] Queue 2-3 orphaned donations → all retry in order on next open
- [ ] Retry with expired JWT → verify re-authentication before retry attempt

---

## 4. Messages — Conversation List

- [ ] Navigate to Messages tab → new conversation row appears with GLIMPSE tag + amount
- [ ] Unread badge shows on the conversation row
- [ ] Tap conversation → chat view opens with welcome message from admin
- [ ] Bottom tab bar disappears when in chat view
- [ ] Swipe back → goes to Messages inbox (NOT Feed tab)
- [ ] Swipe back again from inbox → normal tab behavior

---

## 5. Messages — Chat

- [ ] Type a reply → tap send → message appears as donor bubble
- [ ] Message persists after killing and reopening app
- [ ] Check Supabase `messages` table: new row with correct `sender_wallet`, `conversation_id`
- [ ] Send photo (gallery) → uploads to `chat-media` bucket → appears in chat
- [ ] Send photo (camera) → same verification
- [ ] No camera permission → permission prompt appears, not a crash
- [ ] Toggle airplane mode in chat → reconnect → messages from gap appear (Realtime recovery)
- [ ] Rapid send 3 messages → no duplicates in UI (dedup by id)

---

## 6. Glimpses ↔ Messages Navigation

- [ ] My Glimpses tab shows donation with correct status (PROCESSING or COMPLETED)
- [ ] Tap "VIEW THREAD →" → navigates to Messages tab with correct conversation
- [ ] Chat view loads with the right thread (matching amount, glimpse tag)
- [ ] Back from that thread → Messages inbox (not Feed)

---

## 7. Edge Cases

- [ ] Insufficient USDC balance → clear error, no crash
- [ ] Insufficient SOL for tx fees → clear error
- [ ] Fresh wallet with SOL but no USDC ATA → clear error (not cryptic tx failure)
- [ ] Reject MWA sign prompt → returns to confirm step, can retry
- [ ] Network drops during recording → donation queued in AsyncStorage
- [ ] Double-tap "Confirm and Sign" → only one transaction created
- [ ] Transaction confirmation timeout (Solana congestion) → verify retry queue entry is written BEFORE awaiting confirm
- [ ] Kill app immediately after on-chain confirm, before `record-donation` returns → retry picks it up

---

## 8. Security — Auth

- [ ] Expired JWT → server returns 401, does not process request
- [ ] Missing/empty Authorization header → 401
- [ ] Auth timestamp replay → `auth_challenges` table blocks it
- [ ] Auth timestamp outside 5-min window (past and future) → rejected
- [ ] JWT with tampered `wallet` claim → rejected by edge function

---

## 9. Security — Transaction Integrity

- [ ] Foreign tx attribution → submit someone else's valid USDC tx signature with your JWT → rejected (authority mismatch)
- [ ] Wrong USDC mint (fake SPL token, same decimals) → rejected
- [ ] Wrong destination ATA → rejected
- [ ] Memo missing `tok=usdc` → rejected
- [ ] Amount mismatch between memo and instruction → verify server uses on-chain amount, not memo
- [ ] Devnet tx signature submitted to mainnet endpoint → not found, rejected

---

## 10. Security — RLS

- [ ] As Wallet A, query donations for Wallet B → zero rows
- [ ] As authenticated user, attempt INSERT into donations → denied (service_role only)
- [ ] As authenticated user, attempt UPDATE/DELETE on own donations → denied
- [ ] As Wallet A, read Wallet B's conversations → zero rows
- [ ] Insert message into foreign conversation → denied
- [ ] Set sender_wallet to someone else's address → denied by RLS
- [ ] With anon key (no JWT), attempt reads on all tables → all denied

---

## 11. Security — Data Exposure

- [ ] Decompile release APK → no `service_role` key, no Helius key, no private keys
- [ ] Inspect AsyncStorage on device → only `@glimpse_wallet_jwt`, no seed phrases or secrets
- [ ] Chat media signed URL → modify path to access different conversation's file → denied
- [ ] Error responses → no stack traces, internal table names, or SQL in error messages

---

## 12. Security — Financial Integrity

- [ ] After test donations, compare pool ATA balance on-chain vs SUM(amount_usdc) in Supabase → must match exactly
- [ ] Hold status manipulation → as user, attempt UPDATE `hold_status` on own donation → denied
- [ ] Amount precision → $0.000001 stored with 6-decimal precision, not rounded to zero

---

## 13. Mainnet-Specific (Final Gate)

- [ ] `config/env.ts` cluster = `mainnet-beta`
- [ ] USDC mint = `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- [ ] Pool ATA = `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa`
- [ ] RPC endpoint is Helius mainnet (rotated key)
- [ ] Edge function `RPC_SECRET` env var points to mainnet RPC
- [ ] Explorer links point to mainnet (no `?cluster=devnet`)
- [ ] `__DEV__` is false in release APK (verify via RPC URL or add temp log)
- [ ] Re-enable SGT gating in `navigation/AppNavigator.tsx`
- [ ] Remove mock data from CampaignsScreen + MessagesScreen
- [ ] Deploy migration 011 (explicit deny policies): `npx supabase db push`
- [ ] Deploy edge functions: `npx supabase functions deploy wallet-auth && npx supabase functions deploy record-donation`
- [ ] **One real $1 USDC donation end-to-end — verify the full chain**

---

## Priority Order

1. **Pre-Flight + Section 13 first** — verify config before any tx tests
2. **Sections 1-6** — happy path end-to-end
3. **Section 7** — edge cases
4. **Sections 8-12** — security (can be done in parallel with a second person)
5. **Section 13 final gate** — the $1 mainnet donation
