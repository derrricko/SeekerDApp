# Admin Mode — Design

## Problem

The founder needs to interact with donors from a second Seeker phone: reply to messages, upload receipt photos, and mark donations as completed. There is no admin interface today.

## Approach

Auto-detect admin mode in the same app. When the connected wallet matches `ADMIN_WALLET`, unlock admin features inline — no separate app, tab, or web dashboard.

## Design

### Admin Detection

Compare `publicKey.toBase58()` against `ADMIN_WALLET` from `config/env.ts`. Expose `isAdmin: boolean` from `useWallet()`. No special login flow.

### Messages Tab

No changes needed. `fetchConversations()` already filters by `donor_wallet OR admin_wallet`. Since every conversation has `admin_wallet` set to the pool wallet, connecting with the admin wallet already shows all conversations.

### Mark Completed

When `isAdmin` is true, the chat view shows a "MARK COMPLETED" button if the donation status is `confirmed`. Tapping it:

1. Updates `donations.status` to `'completed'` via Supabase
2. Updates local state so the badge reflects the change immediately
3. Donor sees updated status on their next visit

**RLS:** New UPDATE policy on donations table allowing the admin wallet to set status.

### Photo/Receipt Upload

No changes needed. The existing chat image upload works for receipts. No visual distinction between photos and receipts for launch.

## Summary of Changes

| Area | Change |
|------|--------|
| `WalletProvider.tsx` | Add `isAdmin` boolean derived from wallet address |
| `MessagesScreen.tsx` | Show "MARK COMPLETED" button in chat header when `isAdmin` and status is `confirmed` |
| `services/chat.ts` | Add `updateDonationStatus()` function |
| Migration 017 | RLS policy: admin wallet can UPDATE donations |
| Everything else | No changes |
