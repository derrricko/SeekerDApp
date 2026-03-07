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
- [x] **Verify `config/env.ts`** mainnet values: cluster, USDC mint, pool ATA, RPC endpoint (2026-03-07)

---

## 1. Functional Leaderboard

**What:** Build a leaderboard screen that ranks donors by total USDC given, sourced from the `donations` Supabase table.

**Why:** The leaderboard is core to the Glimpse transparency thesis — public, verifiable giving. Without it, donors can't see the community effect. It's also a key differentiator from "just sending USDC" because the leaderboard proves a pattern of sustained giving.

**Context:** v2 currently has a "Coming soon" placeholder at `screens/LeaderboardScreen.tsx`. The `donations` table in Supabase already records `donor_wallet` and `amount_usdc` for every donation. The leaderboard is a `GROUP BY donor_wallet ORDER BY SUM(amount_usdc) DESC` query. Display as a ranked list with wallet address (truncated), total given, and donation count. Consider adding a Supabase RPC function for efficient aggregation. On-chain verification can be added later by cross-referencing memo data.

**Depends on:** Supabase `donations` table being populated (already done by `services/donations.ts`).

---

## 2. Backend Transaction Listener — DONE

**Implemented as:** Helius webhook (`supabase/functions/helius-webhook/index.ts`). Helius monitors the pool wallet on-chain and POSTs enhanced transaction data to our edge function when USDC arrives. The function parses the Glimpse memo, auto-records the donation, and creates the conversation + welcome message. Idempotent on `tx_signature` — safe alongside client-side recording.

**Deployed:** 2026-03-05. Webhook configured on Helius dashboard, auth token set as Supabase secret.

**Remaining:** Webhook fallback inserts `recipient_id: general` with empty cause preferences (campaign context unavailable from on-chain data alone). Client retry can enrich later. Auth now fails closed if `HELIUS_WEBHOOK_AUTH_TOKEN` is missing (2026-03-07).

---

## 3. Recipient Admin Panel

**What:** Create a Supabase `recipients` table with a simple admin UI for adding/removing causes.

**Why:** Recipients are currently managed through the Supabase dashboard. When Glimpse partners with new nonprofits or individuals, the admin needs a proper interface to add them without direct database access. This also enables recipient-specific metadata (photos, story text, funding goals) that enrich the Give screen.

**Context:** Schema: `Recipient: {id, name, wallet, description, category}`. Migration would add a `recipients` table with these columns. The `GiveScreen` would fetch from Supabase. Admin UI could be a simple web dashboard or a Supabase Studio workflow.

**Depends on:** v2 core being stable and deployed.

---

## 4. Media Upload Error Handling + Progress

**What:** Add progress indicators, retry logic, and user-visible error states for media uploads in the chat.

**Why:** This was flagged as the single critical gap in the v2 plan review. Currently, if a photo/video upload fails in `services/chat.ts` (`uploadChatMedia`), the failure is silent — no error toast, no retry, the user just sees nothing happen. For a demo this is acceptable, but for real use it's a broken experience.

**Context:** The fix involves: (1) wrapping `uploadChatMedia` in a try/catch with a user-visible error toast, (2) adding an upload progress callback using XMLHttpRequest instead of the Supabase client's fetch-based upload, (3) file size validation before upload (reject videos over 50MB), (4) a retry button if upload fails. The `ChatView` component in `screens/MessagesScreen.tsx` is where the UI lives. Estimated effort: 2-3 hours. Filename sanitization is already in place as of 2026-03-07; the remaining gap is user-facing upload UX.

**Depends on:** Chat functionality working end-to-end.

---

## 5. Replace dApp Store Placeholder Assets — DONE

**Completed:** All assets replaced with real branded content and submitted to dApp Store on 2026-03-03.

- `dapp-store/icon-512.png` — branded icon
- `dapp-store/banner-1200x600.png` — branded banner
- `dapp-store/screenshots/` — real app screenshots
- `config.yaml` populated, privacy policy live at `giveglimpse.com/privacy`

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

**Depends on:** Two Seeker phones, mainnet USDC in donor wallet, edge functions deployed.

---

## 7. Resolve Remaining npm Vulnerability State

**What:** Address the 10 remaining npm audit vulnerabilities (3 high, 7 low) that require breaking dependency changes.

**Why:** Supply chain audit (2026-02-28) cleared 15 of 25 vulnerabilities. The remaining 10 are in transitive dependencies that cannot be updated without breaking changes. None affect runtime app security, but they should be resolved for a clean audit posture.

**Context:**
- `bigint-buffer` (3 high) — transitive via `@solana/buffer-layout-utils` → `@solana/spl-token`. Fix requires upgrading to `@solana/spl-token` 0.4.x which is a breaking API change. Monitor for a compatible release.
- `fast-xml-parser` (7 low) — transitive via `@react-native-community/cli`. Build tool only, not bundled into the app. Fix requires upgrading to RN CLI 20.1.2+ which may require RN 0.77+.

**Approach:** Upgrade `@solana/spl-token` when 0.4.x stabilizes and MWA compatibility is confirmed. For `fast-xml-parser`, wait for the next React Native upgrade cycle.

**Depends on:** Mainnet launch stable, `@solana/spl-token` 0.4.x compatible with MWA and `@solana/web3.js` v1.

---

## 8. SKR Integration: "Donate a Seeker" Campaign

**What:** Add a 4th campaign — "Donate a Seeker with $SKR" — that accepts SKR token donations via the same `transferChecked` + Memo pattern. Pool SKR toward funding a Seeker device ($500) for someone in need. SKR donors eligible for 2x points when Seasons launch.

**Why:** Qualifies for the $10,000 SKR Integration Bonus at Monolith (missed for March 9 deadline). Strong narrative alignment — SKR donors fund devices for people who need them, expanding the Seeker ecosystem.

**Design doc:** `docs/plans/2026-03-07-skr-donate-a-seeker-design.md`
**Implementation plan:** `docs/plans/2026-03-07-skr-donate-a-seeker-impl.md`

**Scope (from Codex review):**
- Write path: `config/env.ts`, `donationConfig.ts`, `transfer.ts`, `donations.ts`, `GiveScreen.tsx`
- Read path (P1): `services/chat.ts`, `services/helius.ts`, `CampaignsScreen.tsx`, `MessagesScreen.tsx` — all assume `amount_usdc` today
- Server: `record-donation` (multi-token validation + token-aware minimums + webhook reconciliation enrichment), `helius-webhook` (SKR mint detection + auto-map to donate-a-seeker)
- Migration: `amount_skr NUMERIC(18,6)`, `token_type TEXT` with CHECK constraint
- New helper: `utils/donationDisplay.ts` — `getDonationDisplay()` single source of truth for rendering
- Retry queue: make `PendingConversation` token-aware
- Pre-deploy: derive + pre-create SKR ATA for pool wallet

**Key decisions made:**
- No Jupiter swap needed — accept SKR directly, convert off-chain
- Points = USD-normalized value at time of donation, 2x multiplier for SKR
- SKR mint: `SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3` (6 decimals, same as USDC)

**Depends on:** Mainnet stable, first real USDC campaign complete.
