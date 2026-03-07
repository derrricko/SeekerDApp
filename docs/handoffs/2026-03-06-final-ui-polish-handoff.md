# Final UI Polish — Pre-Demo Handoff

**Date:** 2026-03-06
**Branch:** `main`
**Context:** Hackathon submission due Sunday March 9. App is functional on mainnet. These are cosmetic/UX tweaks before recording the demo video.

---

## What Just Shipped (This Session)

1. **Minimum donation lowered to $1** — all campaigns, client + server (`data/donationConfig.ts` + `record-donation` edge function). For testing only — raise back before production.
2. **Async backend recording** — donation success shows in ~2-3s instead of 7-10s. Backend recording fires in background; Helius webhook is safety net. Changed in `services/donations.ts`.
3. **Messages refresh** — conversations reload on tab focus (`useFocusEffect`), on refresh button tap (top-right `↻` replaces `?` on Messages tab), and pull-to-refresh on conversation list. Changed in `screens/MessagesScreen.tsx` + `navigation/AppNavigator.tsx`.
4. **dApp Store submission info saved** — `STATUS.md` now has tx signature, NFT addresses, submission date (March 3).

## Edge Function Deployed

- `record-donation` redeployed with $1 minimums: `npx supabase functions deploy record-donation --project-ref knvagydrbbvuumabmxcg`

---

## Pending UI Edits (Owner to Specify)

Derrick has UI tweaks to describe. Known items from this session:

- [ ] **Messages header in thread view** — Derrick wants a change to the "MESSAGES" AppHeader when inside an individual conversation. Exact change TBD (he started to describe it but needs to clarify).
- [ ] **Any other visual polish** — Derrick will describe additional tweaks for the demo.

---

## Key Files for UI Work

| Area | File |
|------|------|
| Messages screen (list + thread) | `screens/MessagesScreen.tsx` |
| Tab navigator + top-right button | `navigation/AppNavigator.tsx` |
| App header component | `ui/AppHeader.tsx` |
| Give screen (donation form) | `screens/GiveScreen.tsx` |
| Home screen | `screens/HomeScreen.tsx` |
| Campaigns/feed | `screens/CampaignsScreen.tsx` |
| Theme/colors | `theme/Theme.tsx` |
| Design system reference | `docs/design/brand-guide.md` |

## Before Demo Recording

1. Test donation flow 3x on Seeker at $1
2. Confirm messages refresh works (new thread appears after donation)
3. Apply final UI tweaks
4. Rebuild: `npx react-native run-android`
5. Record screen capture on Seeker

## Before Submission

- [ ] Raise minimums back to $25/$50/$100 (or keep at $1 — owner decision)
- [ ] Redeploy edge function if minimums change
- [ ] Final APK build if updating dApp Store release
- [ ] Submit at https://solanamobile.radiant.nexus/
