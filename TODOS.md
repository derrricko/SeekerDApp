# Glimpse v2 — Deferred Work

## 0. Pre-Mainnet Manual Testing

**What:** Run the full manual test plan before taking real USDC on mainnet.

**Why:** The donation flow touches wallet auth, on-chain USDC transfers, server-side validation, Supabase recording, and Realtime chat. Every handoff is a failure point. This plan covers happy path, edge cases, security (auth, RLS, tx integrity, data exposure), and financial reconciliation.

**Plan:** `docs/testing/2026-03-01-manual-test-plan.md` — 13 sections, ~80 test cases.

**Priority order:**
1. Verify config constants (cluster, mint, ATA, RPC) before any tx tests
2. Happy path end-to-end (wallet → donate → record → messages)
3. Edge cases (insufficient balance, network drops, retry queue)
4. Security (auth bypass, RLS, tx spoofing, APK secrets)
5. Final gate: one real $1 USDC mainnet donation

**Depends on:** Deploy-time items below completed first.

---

## 0b. giveglimpse.com Website

- [x] **Domain purchased** — giveglimpse.com on Namecheap
- [x] **Privacy policy hosted** — `giveglimpse.com/privacy` via GitHub Pages
- [x] **DNS configured** — A records + CNAME pointing to GitHub Pages
- [ ] **Build a real landing page** — replace placeholder with proper marketing site (low priority, not blocking launch)

Repo: `github.com/derrricko/giveglimpse-site`

---

## 0c. Deploy-Time Checklist (Before Mainnet Launch)

- [x] **SGT gating** — server-side only (record-donation edge fn). Client-side removed (public RPC rate-limits Token-2022 queries).
- [x] **Remove mock data** — AppStateProvider deleted, CampaignsScreen uses real Supabase data
- [x] **Rotate Helius API key** — new key deployed to Supabase secrets (2026-03-02)
- [x] **Deploy migrations** — 011 through 016 deployed
- [x] **Deploy edge functions** — wallet-auth + record-donation deployed
- [ ] **Verify `config/env.ts`** mainnet values: cluster, USDC mint, pool ATA, RPC endpoint

---

## 1. Functional Leaderboard

**What:** Build a leaderboard screen that ranks donors by total SOL given, sourced from the `donations` Supabase table.

**Why:** The leaderboard is core to the Glimpse transparency thesis — public, verifiable giving. Without it, donors can't see the community effect. It's also a key differentiator from "just sending SOL" because the leaderboard proves a pattern of sustained giving.

**Context:** v2 currently has a "Coming soon" placeholder at `screens/LeaderboardScreen.tsx`. The `donations` table in Supabase already records `donor_wallet` and `amount_sol` for every donation. The leaderboard is a `GROUP BY donor_wallet ORDER BY SUM(amount_sol) DESC` query. Display as a ranked list with wallet address (truncated), total given, and donation count. Consider adding a Supabase RPC function for efficient aggregation. On-chain verification can be added later by cross-referencing memo data.

**Depends on:** Supabase `donations` table being populated (already done by `services/donations.ts`).

---

## 2. Backend Transaction Listener

**What:** A Supabase Edge Function or cron job that watches Solana for Glimpse donation transactions and auto-creates conversations when one confirms.

**Why:** Currently, conversation creation happens client-side after tx confirmation (`services/donations.ts`). If the user closes the app between tx confirmation and Supabase insert, the donation is on-chain but no chat room exists. The AsyncStorage retry queue (`utils/retry.ts`) mitigates this, but a backend listener would eliminate the gap entirely.

**Context:** The listener would use `connection.onLogs` or poll `getSignaturesForAddress` on the admin/recipient wallets, parse the memo JSON for `"app":"glimpse"`, and create the conversation + welcome message in Supabase. The Memo program makes this possible because every Glimpse donation has a structured JSON memo with `d` (donor), `r` (recipient), `a` (amount), and `app: "glimpse"`. A Supabase pg_cron + Edge Function combo could poll every 30 seconds.

**Depends on:** Stable memo format (already defined in `utils/transfer.ts`), Supabase Edge Functions deployed.

---

## 3. Recipient Admin Panel

**What:** Move the recipient list from hardcoded `data/recipients.ts` to a Supabase `recipients` table with a simple admin UI for adding/removing causes.

**Why:** The hardcoded list works for hackathon demo but doesn't scale. When Glimpse partners with new nonprofits or individuals, the admin needs to add them without a code deploy. This also enables recipient-specific metadata (photos, story text, funding goals) that enrich the Give screen.

**Context:** The `data/recipients.ts` interface (`Recipient: {id, name, wallet, description, category}`) is the schema for the table. Migration would add a `recipients` table with these columns. The `GiveScreen` would fetch from Supabase instead of importing the static array. Admin UI could be a simple web dashboard or even a Supabase Studio workflow.

**Depends on:** v2 core being stable and deployed.

---

## 4. Media Upload Error Handling + Progress

**What:** Add progress indicators, retry logic, and user-visible error states for media uploads in the chat.

**Why:** This was flagged as the single critical gap in the v2 plan review. Currently, if a photo/video upload fails in `services/chat.ts` (`uploadChatMedia`), the failure is silent — no error toast, no retry, the user just sees nothing happen. For a demo this is acceptable, but for real use it's a broken experience.

**Context:** The fix involves: (1) wrapping `uploadChatMedia` in a try/catch with a user-visible error toast, (2) adding an upload progress callback using XMLHttpRequest instead of the Supabase client's fetch-based upload, (3) file size validation before upload (reject videos over 50MB), (4) a retry button if upload fails. The `ChatView` component in `screens/MessagesScreen.tsx` is where the UI lives. Estimated effort: 2-3 hours.

**Depends on:** Chat functionality working end-to-end.

---

## 5. Replace dApp Store Placeholder Assets

**What:** Replace all placeholder dApp Store assets with real branded content before submission.

**Why:** The current icon (plain purple square), banner (solid dark rectangle), and all 4 screenshots (solid-color images) are placeholders. The dApp Store requires real assets showing the actual app experience. Placeholder assets will result in rejection during manual review.

**Assets to replace:**
- `dapp-store/icon-512.png` — 512x512 PNG with Glimpse branding/logo
- `dapp-store/banner-1200x600.png` — 1200x600 PNG with app name, tagline, and/or device mockup
- `dapp-store/screenshots/01-campaigns.png` — 1080x1920, show campaigns list
- `dapp-store/screenshots/02-give.png` — 1080x1920, show give flow with amount entry
- `dapp-store/screenshots/03-done.png` — 1080x1920, show confirmation/done screen
- `dapp-store/screenshots/04-messages.png` — 1080x1920, show messages thread

**Also verify before submission:**
- `config.yaml` publisher/app/release addresses populated (run `npx dapp-store create publisher` + `create app`)
- `https://giveglimpse.com/privacy` is live and returning a privacy policy
- Confirm `com.seekerdapp` is the permanent package name

**Depends on:** App running on-device for screenshot capture.

---

## 6. Two-Phone Messaging Test (Admin Reply Flow)

**What:** Test the full messaging flow using two Seeker phones — one as donor, one as admin wallet.

**Why:** The chat system has RLS policies that should allow both donor and admin wallets to send/read messages in a shared conversation. However, the app was built as donor-facing only. No dedicated admin UI exists. Need to verify whether the admin wallet can actually send messages from the app, or if admin responses are limited to Supabase dashboard inserts.

**Test plan:**
- Phone 1 (donor wallet): Donate USDC, open Messages tab, verify welcome message appears, send a reply
- Phone 2 (admin wallet): Connect admin wallet (`DdqT7Fek...`), check if conversations appear in Messages tab, open a thread, attempt to send a message back to donor
- Verify Realtime: Does donor see admin reply instantly? Does admin see donor reply instantly?
- Verify unread badges update correctly on both phones
- Test media: Can both sides send photos?

**Known gaps to document:**
- No admin mode or role switcher in the app
- Admin wallet is hardcoded — every conversation uses the same admin
- No message edit/delete capability
- No conversation archiving or filtering
- If admin reply from app fails, fallback is Supabase dashboard SQL insert

**Depends on:** Two Seeker phones, devnet USDC in donor wallet, edge functions deployed.

---

## 7. Resolve Remaining npm Vulnerability State

**What:** Address the 10 remaining npm audit vulnerabilities (3 high, 7 low) that require breaking dependency changes.

**Why:** Supply chain audit (2026-02-28) cleared 15 of 25 vulnerabilities. The remaining 10 are in transitive dependencies that cannot be updated without breaking changes. None affect runtime app security, but they should be resolved for a clean audit posture.

**Context:**
- `bigint-buffer` (3 high) — transitive via `@solana/buffer-layout-utils` → `@solana/spl-token`. Fix requires upgrading to `@solana/spl-token` 0.4.x which is a breaking API change. Monitor for a compatible release.
- `fast-xml-parser` (7 low) — transitive via `@react-native-community/cli`. Build tool only, not bundled into the app. Fix requires upgrading to RN CLI 20.1.2+ which may require RN 0.77+.

**Approach:** Upgrade `@solana/spl-token` when 0.4.x stabilizes and MWA compatibility is confirmed. For `fast-xml-parser`, wait for the next React Native upgrade cycle.

**Depends on:** Mainnet launch stable, `@solana/spl-token` 0.4.x compatible with MWA and `@solana/web3.js` v1.
