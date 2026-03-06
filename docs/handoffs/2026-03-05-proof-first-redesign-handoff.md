# Proof-First Redesign — Handoff

**Date:** 2026-03-05
**Commits:** `50947f48..4128b4b4` (7 commits on `main`)
**Quality gates:** ESLint 0 warnings, TypeScript clean, Jest 70/70, Metro bundle passes
**Design doc:** `docs/plans/2026-03-05-proof-first-redesign-design.md`
**Impl plan:** `docs/plans/2026-03-05-proof-first-redesign-impl.md`

---

## Changed Files (11 total)

### New File
| File | What it is |
|---|---|
| `ui/ProofCard.tsx` | Signature component — renders a donation as a blockchain proof card with 3-state verification (verified/pending/unavailable) |

### Modified Files
| File | What changed |
|---|---|
| `theme/Theme.tsx` | Added `display`/`displayRegular` typography tokens (Cormorant Garamond). Restored radius scale (sm:6, md:10, lg:16, xl:18). Replaced hard-offset shadows with subtle elevation. Added `surfaceMuted`/`borderMuted` colors. |
| `ui/SurfaceCard.tsx` | borderWidth 3→1, borderColor border→borderMuted, borderRadius sm→lg |
| `ui/PrimaryButton.tsx` | borderRadius sm→md, borderWidth 2→1.5, minHeight 54→48, fontSize 22→14 |
| `ui/AppHeader.tsx` | fontSize 44→28, lineHeight 52→34, letterSpacing 8→4, fontFamily brand→display, rule height 3→2 |
| `screens/CampaignsScreen.tsx` | Replaced inline card rendering with ProofCard components. Feed mode shows donorWallet. My Glimpses mode adds "VIEW THREAD" action + navigation. Toggle refined (borderWidth 1, borderRadius 10). |
| `screens/HomeScreen.tsx` | Complete rewrite. G lettermark with breathing opacity animation. "Give. See the proof. Start a conversation." headline in Cormorant Garamond. "GIVE A GLIMPSE" CTA. 3-step strip as caption. |
| `screens/GiveScreen.tsx` | Added QUICK_AMOUNTS [5,10,25,50] pills. Amount input in Cormorant display font. Optional fields collapsed under "ADD A NOTE" toggle. Processing step becomes receipt moment with "View Your Thread" + "Done" CTAs. All borderWidth 2→1. |
| `screens/MessagesScreen.tsx` | Compact ProofCard at thread header showing donation amount + verification state. Conversation rows: borderWidth 1, borderColor borderMuted, borderRadius lg. |
| `screens/HowItWorksCarousel.tsx` | Headlines use Cormorant Garamond Light. Primary button: borderWidth 1.5, borderRadius 10, minHeight 44. Nav buttons: minHeight 34, borderRadius 8. |
| `navigation/AppNavigator.tsx` | Center button: pill shape (paddingHorizontal 20, height 40, borderRadius 20) replacing 132px circle. Tab bar height 64 (was 84). Removed topFill/topRail brutalist borders. Active indicator: 4px teal dot (was 18x3 bar). Help button: 32x32, borderWidth 1. |

---

## Design Intent

**North star:** "Beautiful, elegant, magnificent — the best app of 2026."

**Typography:** Courier Prime (brand/body/labels/buttons) + Cormorant Garamond Light (display headlines/amounts). No other fonts.

**Surfaces:** Translucent rgba backgrounds with subtle 1px borders. No blur (Android doesn't support backdrop-filter). Glass effect through transparency alone.

**Verification model:** 3 states derived from Helius Enhanced Transactions API:
- `verified` — enhanced data fetched, teal accent bar, shield+G badge, "VERIFIED ON-CHAIN"
- `pending` — enhanced data loading, neutral state
- `unavailable` — fetch failed or no data, graceful fallback

**Shadows:** Subtle elevation (not hard-offset brutalist). Light theme: `#1A1125` at low opacity. Dark theme: `#000000` at moderate opacity.

**Radius:** Restored from 0 (brutalist) to brand guide values: sm:6, md:10, lg:16, xl:18, pill:999.

**No forced dark mode.** Follows system preference, light is default.

---

## What NOT to Change

- Backend pipeline (Supabase, edge functions, Helius webhook) — untouched
- `services/` directory — no changes
- `utils/` directory — no changes
- `config/` directory — no changes
- Test files — no changes (all 70 still pass)
- Navigation structure — still 4 tabs (Glimpses, Give, Messages, Rank)

---

## Build & Verify

```bash
# Quality gates (all must pass)
npx eslint . --ext .ts,.tsx --max-warnings=0
npx tsc --noEmit
npm test -- --watchAll=false

# Bundle check
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle

# Push to device
adb reverse tcp:8081 tcp:8081
npx react-native run-android
```
