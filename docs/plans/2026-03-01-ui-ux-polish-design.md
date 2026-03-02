# UI/UX Polish Design — Pre-Mainnet

**Date:** 2026-03-01
**Branch:** `v2/mainnet-launch`
**Goal:** Visual polish and investor/demo readiness without changing the brutalist aesthetic.

## Scope

Three areas: Feed tab layout, Give screen refinement, cross-cutting consistency.

## 1. Feed Tab (CampaignsScreen)

### Feed Cards — Strengthen Hierarchy
- Make dollar amount the lead element: 18px, weight 700, textPrimary
- Impact note stays as body text (13px)
- COMPLETED badge + timestamp meta row unchanged

### History Cards — Cleaner Layout + Navigation CTA
- Amount stays as lead
- Remove raw "Mode: solo - Cadence: one_time" line — replace with just recipient + date
- Add "VIEW THREAD →" text link (accent color) that navigates to Messages tab with conversationId
- This is the primary feed→messages connection

### Remove Dead-End Note
- Delete "Feed is summary-only; message threads are in the Messages tab"
- Inline "VIEW THREAD" links replace it

### Section Labels
- Bump from 10px → 11px
- Increase bottom margin from 10px → 14px

## 2. Give Screen (GiveScreen)

### Group Required vs Optional Fields
- Add thin divider line between required (Amount, Campaign) and optional (Match Context, Note)
- Add "OPTIONAL" section label above optional fields (same style as existing field labels)

### Confirm Step — Balance Buttons
- "Back" becomes ghost-style (no fill, border only), full width, stacked above "Confirm and Sign"
- Remove rounded pill on confirm button (borderRadius 32 → 0) to match brutalist system
- Both buttons full width — Back is visually lighter, Confirm is heavier

### Timeline Copy — Scannable Lines
Replace paragraph with 3 bullet-style lines:
- "On-chain confirmation is immediate"
- "24-48 hours: matched to a specific need"
- "5-7 days: receipts, photos, and updates"

### Processing State — More Weight
- Wrap "DONATION CONFIRMED" in SurfaceCard
- Add donation amount prominently (not buried in body text)
- Explorer link and Done button unchanged

## 3. Cross-Cutting Consistency

### Hardcoded Colors → Theme Tokens
- CampaignsScreen: replace 8+ inline `rgba(26,17,37,...)` with theme colors
- MessagesScreen: replace hardcoded `#F4F1FF`, `#FFFFFF`, `#1A1125`, `#6554D1` with theme tokens
- No visual change — just maintainability

### Animation Duration Normalization
Standardize to 3 tiers:
- **Fast (100ms):** micro-interactions (pulse, field focus)
- **Medium (180ms):** menus, indicators, message bubbles
- **Slow (250ms):** step transitions, screen-level changes

### Tab Bar Theme Deduplication
- Replace `TAB_BAR_THEME` in AppNavigator with actual theme context values
- Requires threading useTheme into the tab bar component

## Out of Scope
- No aesthetic changes (keep brutalist: 0 radius, bold borders, Courier Prime, hard shadows)
- No new screens or features
- No leaderboard work
- Border radii on chat bubbles and conversation rows are intentional — not changing
