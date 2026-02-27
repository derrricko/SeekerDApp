# Glimpse v2 — Deferred Work

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
