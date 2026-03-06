# Proof-First Feed Redesign — Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Default operating skill: `solana-seeker-dev` v2.1 — check all changes against Solana playbook.

**Goal:** Redesign every Glimpse screen around the principle that blockchain proof IS the product. Connection-forward, not number-forward. Beautiful, elegant, magnificent.

**Architecture:** UI-only redesign. No changes to the transaction pipeline, edge functions, or data model. Theme tokens updated, new Proof Card component, existing screens restyled. Backend untouched.

**North Star:** "Beautiful, elegant, magnificent — the best app of 2026."

**Deadline:** Monolith hackathon submission, Sunday March 9, 7PM.

---

## Constraints (Non-Negotiable)

| Constraint | Detail |
|---|---|
| **Backend untouched** | `services/donations.ts`, `utils/transfer.ts`, edge functions, Supabase schema — zero changes |
| **4 tabs preserved** | Glimpses, Give, Messages, Rank — Rank stays, visually deprioritized |
| **System/light default** | `initialMode` stays `'light'` or switches to `'system'`. No forced dark mode |
| **Typography locked** | Courier Prime (labels, buttons, brand) + Cormorant Garamond (amounts, headlines). No Inter |
| **No pool balance hero** | Home screen focuses on connection, not numbers |
| **Explicit CTAs** | No auto-navigate. Every screen transition is user-initiated |
| **Performance-first** | No new heavy animations without Seeker device FPS validation |
| **Stack locked** | React Native 0.76.5, `@solana/web3.js` v1, `@solana/spl-token` v0.3.x, MWA v2 |

---

## Intent

**Who is this human?** A crypto-native 20-something on a Solana Seeker phone. Between apps, scrolling. Heard about Glimpse, wants to see if it's legit. Needs to feel trust in under 3 seconds.

**What must they accomplish?** Give USDC to a real cause and see permanent proof it happened. Under 15 seconds from open to receipt.

**What should this feel like?** A premium fintech receipt — Cash App's speed with the gravitas of a permanent record. Dense where it matters (proof data), spacious where it breathes (amounts, CTAs). Glass surfaces with precise teal verification accents.

---

## Design System Updates

### Palette (Why)

Purple fluorescence (`#BF5AF2` dark / `#6554D1` light) — the glow of something alive on-chain. Digital, electric. Primary accent.

Teal verification (`#40E0D0` dark / `#47CBCD` light) — trust color. Medical verification, banking confirmations use blue-green. This is the "it's real" color. Used ONLY for verification states.

Deep indigo (`#0A1628`) — dark canvas. Stars (data points) against void.

Receipt parchment (`#F3EFFF` light surfaces) — warm. The substrate on which proof is written.

Graphite slate (`rgba(30,41,59,0.65)`) — dark glass surfaces. Seriousness of accountability.

### Depth Strategy: Glass + Borders

One approach, committed: **Glass surfaces with whisper-quiet borders.**

- Cards: translucent background + `rgba(255,255,255,0.08)` border (dark) or `rgba(26,17,37,0.12)` border (light)
- No hard-offset brutalist shadows (current system)
- Elevation via surface opacity progression, not shadow intensity
- Border radius restored to brand guide values (currently all `0`)

### Border Radius Scale

| Token | Current | Proposed | Usage |
|---|---|---|---|
| `sm` | 0 | 6 | Badges, status pills |
| `md` | 0 | 10 | Buttons, inputs |
| `lg` | 0 | 16 | Cards, panels |
| `xl` | 0 | 18 | Modals, sheets |
| `pill` | 999 | 999 | Unchanged |

### Typography Scale

| Role | Font | Size | Weight | Spacing | Usage |
|---|---|---|---|---|---|
| Display amount | Cormorant Garamond | 36px | 300 (Light) | — | Hero donation amounts |
| Section heading | Cormorant Garamond | 28px | 300 (Light) | — | Screen titles, card headlines |
| Card amount | Cormorant Garamond | 22px | 400 (Regular) | — | Proof Card amounts |
| Brand label | Courier Prime | 12px | 700 (Bold) | 1.1px | Buttons, tab labels, kickers |
| Body | Courier Prime | 15px | 400 (Regular) | — | Descriptions, chat messages |
| Metadata | Courier Prime | 10px | 400 (Regular) | 0.3px | Wallet addresses, timestamps |

**Why Cormorant Garamond for amounts:** Serif + light weight gives amounts the feeling of an engraved receipt. Numbers feel deliberate, not casual. Courier Prime monospace for everything else keeps the technical/proof aesthetic.

### Spacing

Base unit: **4px** (brand guide). Scale: 4, 8, 12, 16, 20, 24, 32, 48.

### Shadow System (Revised)

Replace current hard-offset brutalist shadows with subtle elevation:

```typescript
// Dark mode — lean on borders, shadows barely visible
subtle: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, elevation: 2 }
card:   { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: {width: 0, height: 4}, elevation: 3 }
press:  { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: {width: 0, height: 1}, elevation: 1 }

// Light mode — shadows do more work
subtle: { shadowColor: '#1A1125', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: {width: 0, height: 2}, elevation: 2 }
card:   { shadowColor: '#1A1125', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: {width: 0, height: 6}, elevation: 3 }
press:  { shadowColor: '#1A1125', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: {width: 0, height: 1}, elevation: 1 }
```

---

## Signature Element: The Proof Card

A card component that renders a verified on-chain donation as a living receipt. Could only exist in THIS product.

### Three Verification States

| State | Left Accent | Badge | Label | When |
|---|---|---|---|---|
| **Verified** | 4px teal solid | Shield + G monogram | `VERIFIED ON-CHAIN` | `enhancedData.verified === true` |
| **Pending** | 4px muted border | Spinner (ActivityIndicator) | `CONFIRMING...` | Enhanced data loading or `verified === undefined` |
| **Unavailable** | No accent | None | None | Enhanced data fetch failed or returned `verified === false` |

### Proof Card Anatomy

```
┌─────────────────────────────────────────────┐
│ ┌──┐                                        │
│ │T │  $25.00 USDC          VERIFIED ON-CHAIN│
│ │E │  Cormorant 22px       [shield] teal    │
│ │A │                                        │
│ │L │  HQ5C...8Tu2 — Public Schools          │
│ │  │  Courier 10px   Courier 12px           │
│ │A │                                        │
│ │C │  View on Explorer ↗      Mar 5, 2026   │
│ │C │  teal link               tertiary      │
│ │E │                                        │
│ │N │  [VIEW THREAD →]                       │
│ │T │  accent, Courier 10px bold             │
│ └──┘                                        │
└─────────────────────────────────────────────┘
```

The teal left accent is the signature. It's the visual proof indicator — you can scan a list of Proof Cards and instantly see which are verified.

### Proof Card Where It Appears

1. **Glimpses feed** — every donation row becomes a Proof Card
2. **My Glimpses** — same Proof Card, with `VIEW THREAD →` action
3. **Messages thread header** — compact Proof Card variant (amount + verification + explorer link)

---

## Screen-by-Screen Design

### Screen 1: Home (Welcome)

**File:** `screens/HomeScreen.tsx`

**Current:** 3-step strip (GIVE → CONFIRM → SEE PROOF) + "START DONATION" CTA on plain background.

**Proposed:**
- Background: `theme.colors.background` (respects system/light/dark)
- G lettermark centered with subtle breathing opacity animation (0.85 → 1.0 → 0.85, 3s cycle, `useNativeDriver: true`)
- `DOCUMENTING KINDNESS` kicker in Courier Prime 13px, 3px letter-spacing
- Connection copy: "Give. See the proof. Start a conversation." in Cormorant Garamond 22px
- `GIVE A GLIMPSE` CTA — accent background, brand guide button spec (radius 10, pad 12/24)
- 3-step strip refined as subtle bottom caption — smaller, tertiary text color, no animated stagger on mount
- No data fetches — static, fast, zero failure modes on first screen

**Animation budget:** One animation total — the G mark breathing. No stagger, no translateY entrances. Performance-safe.

**Why connection copy:** The user said "focus on connection." The three verbs (give, see, start) map to the three-step flow but frame it as a human journey, not a process diagram.

### Screen 2: Glimpses Feed

**File:** `screens/CampaignsScreen.tsx`
**Dependencies:** `services/helius.ts` (EnhancedDonation), `services/chat.ts` (fetchAllDonations, fetchDonationHistory)

**Current:** FEED/MY GLIMPSES toggle, flat donation cards with small verified badge.

**Proposed:**
- Segmented control: glass surface, accent indicator pill, brand guide radius 10
- Each donation row → **Proof Card** (see signature section above)
- Amount rendered in Cormorant Garamond Regular 22px (currently 13px Inter bold)
- Verification badge enlarged: shield 18px, text alongside at 9px
- `View on Explorer ↗` always visible in teal (not buried)
- Staggered card entrance: 0.15s offset, translateY 8px, opacity 0→1, `useNativeDriver: true`
- Pull-to-refresh resets staleness cache (`lastFeedFetchAt`, `lastHistoryFetchAtByWallet`)

**Feed-specific Proof Card:** Shows donor wallet (truncated), campaign, explorer link. No thread link (feed is public).

**My Glimpses Proof Card:** No donor wallet. Shows campaign, date, `VIEW THREAD →` action.

**Empty states:** Glass card, centered Courier Prime text, branded:
- Feed: "No donations yet. Be the first to give a glimpse."
- My Glimpses (no wallet): "Connect your wallet to see your donation history." + `CONNECT WALLET →`
- My Glimpses (empty): "No donations recorded for this wallet yet."

### Screen 3: Give Flow

**File:** `screens/GiveScreen.tsx`
**Dependencies:** `data/donationConfig.ts` (CAMPAIGN_OPTIONS, MATCHING_POOL), `services/donations.ts` (executeDonationSeamless)

**Current:** 4-field form → confirm → processing. Campaign dropdown, match context, recipient note.

**Proposed — UI simplification only, same backend logic:**

**Step 1 (form):**
- Amount input: display number in Cormorant Garamond Light 36px (currently 34px Courier Prime bold)
- Quick-select pills: `$5` `$10` `$25` `$50` — horizontal row, glass surface, tapping sets `amountInput`
- Campaign dropdown: same `CAMPAIGN_OPTIONS`, same selection logic, refined styling (glass surface, brand radius)
- Optional fields: collapsed under `ADD A NOTE ▾` disclosure toggle (currently always visible)
- Match context + recipient note: same fields, same `onChangeText`, hidden by default
- `REVIEW DONATION` CTA

**Step 2 (confirm):**
- Receipt-style review card: amount in Cormorant Garamond Light 36px, campaign, timeline
- Same validation logic (`validateForm()`)
- Same timeline items
- `BACK` secondary button + `CONFIRM & SIGN` primary CTA
- No animation changes to step transition (current crossfade works)

**Step 3 (processing → receipt moment):**
- Title: `DONATION CONFIRMED` in Courier Prime
- Amount: Cormorant Garamond Light 36px with accent color
- Tx signature truncated: `View Proof ↗` link (teal, not accent)
- `VIEW YOUR THREAD →` explicit CTA (not auto-navigate)
- `DONE` secondary CTA to return to feed
- Same `processingTxSig` logic, same `reset()`, same `navigation.navigate('Messages', {conversationId})`

**What does NOT change:**
- `executeDonationSeamless()` call and all its parameters
- `sendMessage()` for donor context/note
- `normalizeAmountInput()` validation
- `CAMPAIGN_OPTIONS` data structure
- `MATCHING_POOL` wallet address
- Orphan retry queue behavior
- Error handling and error display

### Screen 4: Messages

**File:** `screens/MessagesScreen.tsx`

**Current:** Conversation list + chat bubbles. Functional.

**Proposed (polish only):**
- **Donation context card** at top of each thread: compact Proof Card variant showing amount, campaign, verification status, explorer link. Uses same `enhancedData` from Helius.
- Chat bubbles: glass surface treatment (current opaque backgrounds → translucent)
- Thread list cards: glass surface, last message preview truncated at 2 lines, unread dot (accent color)
- Consistent typography: Courier Prime for message body, Cormorant Garamond for amounts if displayed
- Same `useChatMessages()` hook, same `sendMessage()`, same media upload logic

### Navigation

**File:** `navigation/AppNavigator.tsx`

**Current:** 3-tab bar with 132px DONATE circle.

**Proposed:**
- Tab bar height: 64px (from 84px)
- DONATE button: accent-colored pill at normal tab size — `GIVE` label, not a giant circle
- Width: auto (fits content + padding), not 132px fixed
- No negative `marginTop` offset (currently -62px)
- Glass surface background for the bar
- Active indicator: teal 4px dot below active tab (replacing scaleX bar)
- Tab bar still hides during chat threads and give flow (current behavior preserved)
- `?` help button remains in top-right position
- HowItWorksCarousel: same logic, refined styling (glass sheet, brand radius)

---

## File Reference Map

### Files Modified (UI Only)

| File | What Changes | What Does NOT Change |
|---|---|---|
| `theme/Theme.tsx` | Border radius, shadows, surface colors, typography tokens | ThemeProvider API, ThemeMode type, color scheme detection |
| `screens/HomeScreen.tsx` | Layout, copy, animation, typography | `onContinue` prop contract |
| `screens/CampaignsScreen.tsx` | Card rendering, typography, verification badge size | Data fetching, Helius integration, staleness cache, wallet reset logic |
| `screens/GiveScreen.tsx` | Typography, quick-select pills, optional field collapse | `executeDonationSeamless()`, `sendMessage()`, validation, error handling |
| `screens/MessagesScreen.tsx` | Bubble styling, thread list cards, context card | `useChatMessages()`, media upload, Realtime subscription, unread tracking |
| `screens/HowItWorksCarousel.tsx` | Sheet styling, typography | Modal logic, step content, navigation |
| `navigation/AppNavigator.tsx` | Tab bar layout, DONATE button size, active indicator | Navigation container, tab routes, 4-tab structure, hide logic |
| `ui/SurfaceCard.tsx` | Glass surface treatment | Component API |
| `ui/PrimaryButton.tsx` | Typography, radius | `onPress` contract |
| `ui/AppHeader.tsx` | Typography | Component API |

### Files NOT Modified

| File | Why Untouched |
|---|---|
| `services/donations.ts` | Transaction pipeline locked |
| `services/auth.ts` | Wallet auth locked |
| `services/chat.ts` | Chat CRUD locked |
| `services/helius.ts` | Helius integration working |
| `services/supabase.ts` | Supabase client locked |
| `utils/transfer.ts` | SPL transfer builder locked |
| `utils/errors.ts` | Error handling locked |
| `utils/retry.ts` | Orphan recovery locked |
| `config/env.ts` | Mainnet constants locked |
| `data/donationConfig.ts` | Campaign data locked (unless adding "general" display) |
| `supabase/functions/*` | Edge functions locked |
| `supabase/migrations/*` | Schema locked |
| `components/providers/*` | WalletProvider, ConnectionProvider, UnreadProvider locked |

### Reference Documents

| Document | What It Governs |
|---|---|
| `docs/design/brand-guide.md` | Full design system: colors, typography, spacing, components, animation specs |
| `docs/SOUL.md` | Founder voice — use verbatim lines where applicable |
| `CLAUDE.md` | Architecture, data flow, entity structure |
| `STATUS.md` | Current priorities, quality gates |
| `TODOS.md` | Deferred work — do not conflict |
| `.agents/skills/solana-seeker-dev/SKILL.md` | Mainnet source-of-truth, MWA patterns, security checklist |

---

## Build Order

Seven tasks, executed sequentially. Each task is self-contained and produces a working app state.

### Task 1: Theme Token Pass + Typography Consistency

Update `theme/Theme.tsx` border radius, shadows, and add Cormorant Garamond to typography tokens. Verify all screens still render correctly with new radius values.

### Task 2: Proof Card Component + 3-State Verification Model

Create a reusable `ProofCard` component in `ui/ProofCard.tsx` with verified/pending/unavailable states. Teal left accent, shield badge, Cormorant Garamond amounts.

### Task 3: Glimpses Feed Conversion to Proof Cards

Replace inline card rendering in `CampaignsScreen.tsx` with the new ProofCard component. Refine segmented control styling.

### Task 4: Home Screen Rewrite (Connection Focus)

Rewrite `HomeScreen.tsx` with connection-forward copy, G mark breathing animation, refined typography. No data fetches.

### Task 5: Give Flow Visual Simplification (Same Backend)

Add quick-select amount pills, collapse optional fields, update typography to Cormorant Garamond for amounts. Replace processing screen with receipt moment + explicit CTAs.

### Task 6: Messages Polish + Donation Context Card

Add compact Proof Card at thread header. Refine bubble styling and thread list cards.

### Task 7: Navigation + Final Motion Pass

Resize tab bar, replace DONATE circle with accent pill, add teal active indicator. Final animation audit — only after interaction speed confirmed on Seeker device.

---

## Quality Gates

Run after every task:

```bash
# Lint (zero warnings)
npx eslint . --ext .ts,.tsx --max-warnings=0

# Type check
npx tsc --noEmit

# Unit tests
npm test -- --watchAll=false

# Bundle check (catches broken imports)
CI=true npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/glimpse.bundle
```

### Performance Gate (Task 7 Only)

Before any new animation ships:
1. Build release APK: `cd android && ./gradlew assembleRelease`
2. Install on Seeker device
3. Verify 60fps during: tab switches, card scroll, give flow transitions
4. If any jank: remove the animation, ship without it

---

## Risk Notes

| Risk | Mitigation |
|---|---|
| Cormorant Garamond not bundled in APK | Verify font files exist in `android/app/src/main/assets/fonts/`. If missing, add them before Task 1 |
| Border radius change breaks layout on some screens | Test each screen after Task 1 radius update |
| Quick-select pills add tap targets that interfere with amount input | Pills set `amountInput` state, same validation path. No new data flow |
| Proof Card component increases bundle size | Single component, no new dependencies. Negligible |
| Glass surfaces may perform poorly on Seeker | Test `rgba` backgrounds without `backdrop-filter` (RN doesn't support blur natively on Android without extra library). Use solid translucent backgrounds, not blur |

### Android-Specific Note

React Native on Android does not support `backdrop-filter: blur()`. The "glass" effect in this design means translucent `rgba` backgrounds with subtle borders — NOT actual blur. This matches the current `theme/Theme.tsx` dark surface: `rgba(30,41,59,0.78)`. No new library needed.

---

## Solana Dev Checklist (Per solana-seeker-dev Skill)

This redesign is UI-only, but verify these are NOT broken:

- [ ] `config/env.ts` mainnet constants unchanged
- [ ] `data/donationConfig.ts` campaign data unchanged
- [ ] `services/donations.ts` export signatures unchanged
- [ ] `utils/transfer.ts` unchanged
- [ ] `services/helius.ts` `EnhancedDonation` type consumed correctly in ProofCard
- [ ] `WalletProvider.tsx` API unchanged (connect, publicKey, authorizeSignAndBuildTransaction)
- [ ] `UnreadProvider.tsx` API unchanged (totalUnread, activeConversationId)
- [ ] Bundle check passes (polyfill order intact)
- [ ] No new dependencies added

---

*Design approved by Derrick Woepking, 2026-03-05. Build order and constraints locked.*
