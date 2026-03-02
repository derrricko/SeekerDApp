# UI/UX Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship visual polish and investor/demo readiness across Feed tab, Give screen, and cross-cutting consistency — without changing the brutalist aesthetic.

**Architecture:** Pure presentation changes across 4 files. Add 2 semantic color tokens to Theme.tsx (surfaceMuted, borderMuted) to replace hardcoded rgba values. All other changes are style/layout edits in existing screen components.

**Tech Stack:** React Native 0.76, TypeScript, Animated API, existing Theme/SurfaceCard system.

---

### Task 1: Add Semantic Theme Tokens

**Files:**
- Modify: `theme/Theme.tsx:14-28` (AppTheme interface, colors)
- Modify: `theme/Theme.tsx:74-121` (lightTheme)
- Modify: `theme/Theme.tsx:123-148` (darkTheme)

**Step 1: Add two new color tokens to the AppTheme interface**

In `theme/Theme.tsx`, add `surfaceMuted` and `borderMuted` to the `colors` type:

```typescript
// Inside AppTheme.colors, after 'overlay':
surfaceMuted: string;
borderMuted: string;
```

**Step 2: Set values in lightTheme**

```typescript
// Inside lightTheme.colors, after overlay:
surfaceMuted: 'rgba(26,17,37,0.04)',
borderMuted: 'rgba(26,17,37,0.12)',
```

**Step 3: Set values in darkTheme**

```typescript
// Inside darkTheme.colors, after overlay:
surfaceMuted: 'rgba(255,255,255,0.04)',
borderMuted: 'rgba(255,255,255,0.08)',
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 5: Commit**

```bash
git add theme/Theme.tsx
git commit -m "feat: add surfaceMuted and borderMuted theme tokens"
```

---

### Task 2: Feed Tab — Strengthen Card Hierarchy + Section Labels

**Files:**
- Modify: `screens/CampaignsScreen.tsx:109-116` (toggle hardcoded colors → theme)
- Modify: `screens/CampaignsScreen.tsx:162` (panelRule hardcoded color → theme)
- Modify: `screens/CampaignsScreen.tsx:218-224` (feedEmpty hardcoded colors → theme)
- Modify: `screens/CampaignsScreen.tsx:240-245` (feedCard hardcoded colors → theme)
- Modify: `screens/CampaignsScreen.tsx:248-256` (feedTitle font size 13→18)
- Modify: `screens/CampaignsScreen.tsx:302-311` (remove dead-end note from feed)
- Modify: `screens/CampaignsScreen.tsx:456-500` (styles: sectionLabel, feedTitle, togglePillActive)
- Modify: `screens/CampaignsScreen.tsx:484` (togglePillActive hardcoded color → theme)

**Step 1: Replace all hardcoded rgba colors in the toggle with theme tokens**

In `CampaignsScreen.tsx`, find the toggle `<View>` (line ~109-116). Change:

```typescript
// OLD
borderColor: 'rgba(26,17,37,0.1)',
backgroundColor: 'rgba(26,17,37,0.06)',

// NEW
borderColor: theme.colors.borderMuted,
backgroundColor: theme.colors.surfaceMuted,
```

**Step 2: Replace panelRule hardcoded color**

Find the panelRule `<View>` (line ~162). Change:

```typescript
// OLD
{backgroundColor: 'rgba(26,17,37,0.12)'}

// NEW
{backgroundColor: theme.colors.borderMuted}
```

**Step 3: Replace togglePillActive hardcoded color**

In the `styles` object, find `togglePillActive` (line ~484). Change:

```typescript
// OLD
togglePillActive: {
  backgroundColor: 'rgba(26,17,37,0.18)',
},

// NEW — remove from StyleSheet, apply inline with theme
```

Instead, update the inline style on each toggle pill where `viewMode === 'feed'` / `viewMode === 'my_glimpses'` active check is used. Replace:

```typescript
viewMode === 'feed' && styles.togglePillActive,
```

with:

```typescript
viewMode === 'feed' && {backgroundColor: theme.colors.borderMuted},
```

And same for `my_glimpses`. Then delete `togglePillActive` from the StyleSheet.

**Step 4: Replace feedEmpty hardcoded colors**

Find feedEmpty `<View>` (line ~218-224). Change:

```typescript
// OLD
backgroundColor: 'rgba(26,17,37,0.04)',
borderColor: 'rgba(26,17,37,0.1)',

// NEW
backgroundColor: theme.colors.surfaceMuted,
borderColor: theme.colors.borderMuted,
```

**Step 5: Replace feedCard hardcoded colors**

Find feedCard map `<View>` (line ~240-245). Change:

```typescript
// OLD
backgroundColor: 'rgba(26,17,37,0.04)',
borderColor: 'rgba(26,17,37,0.12)',

// NEW
backgroundColor: theme.colors.surfaceMuted,
borderColor: theme.colors.borderMuted,
```

**Step 6: Strengthen feed card amount hierarchy**

The feedTitle currently mixes the wallet address and the dollar amount in one 13px line. Separate them:

In the feedCard map body (line ~247-261), replace the single `<Text style={feedTitle}>` with two elements:

```tsx
<Text
  style={[
    styles.feedAmount,
    {
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.brand,
    },
  ]}>
  ${item.amount.toFixed(0)} USDC
</Text>
<Text
  style={[styles.feedBody, {color: theme.colors.textSecondary}]}>
  {item.wallet} gave for {item.impact}.
</Text>
```

Add to styles:

```typescript
feedAmount: {
  fontSize: 18,
  lineHeight: 22,
  fontWeight: '700',
  marginBottom: 2,
},
```

Keep existing `feedBody` style (fontSize 13, lineHeight 18) unchanged.

**Step 7: Bump section label size and spacing**

In the `styles` object, update `sectionLabel`:

```typescript
// OLD
sectionLabel: {
  fontSize: 10,
  lineHeight: 12,
  letterSpacing: 1,
  marginBottom: 10,
},

// NEW
sectionLabel: {
  fontSize: 11,
  lineHeight: 14,
  letterSpacing: 1,
  marginBottom: 14,
},
```

**Step 8: Remove the dead-end feed note**

Delete the entire `<Text>` block at the end of `renderFeed` (lines ~302-311):

```tsx
// DELETE THIS BLOCK:
<Text
  style={[
    styles.note,
    {
      color: theme.colors.textTertiary,
      fontFamily: theme.typography.brand,
    },
  ]}>
  Feed is summary-only; message threads are in the Messages tab.
</Text>
```

**Step 9: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 10: Commit**

```bash
git add screens/CampaignsScreen.tsx
git commit -m "feat: strengthen feed card hierarchy and replace hardcoded colors"
```

---

### Task 3: Feed Tab — History Card Cleanup + VIEW THREAD Navigation

**Files:**
- Modify: `screens/CampaignsScreen.tsx:374-440` (history card rendering)
- Modify: `screens/CampaignsScreen.tsx:442-453` (remove history note)

**Step 1: Replace history card hardcoded colors with theme tokens**

Find the history card `<TouchableOpacity>` (line ~399-405). Change:

```typescript
// OLD
backgroundColor: 'rgba(26,17,37,0.04)',
borderColor: 'rgba(26,17,37,0.12)',

// NEW
backgroundColor: theme.colors.surfaceMuted,
borderColor: theme.colors.borderMuted,
```

**Step 2: Replace stateCard hardcoded colors**

Find `stateCard` in the StyleSheet (line ~650-655). Change:

```typescript
// OLD
stateCard: {
  borderRadius: 10,
  borderWidth: 1,
  borderColor: 'rgba(26,17,37,0.12)',
  backgroundColor: 'rgba(26,17,37,0.04)',
},

// NEW — remove hardcoded colors, apply via theme inline
stateCard: {
  borderRadius: 10,
  borderWidth: 1,
},
```

Then update each stateCard usage to add theme colors inline:

```tsx
<View style={[styles.stateCard, styles.centeredState, {
  borderColor: theme.colors.borderMuted,
  backgroundColor: theme.colors.surfaceMuted,
}]}>
```

**Step 3: Remove raw Mode/Cadence line from history cards**

Find the second `<Text style={historyMeta}>` inside the history card (line ~429-435). Delete:

```tsx
// DELETE THIS:
<Text
  style={[
    styles.historyMeta,
    {color: theme.colors.textTertiary},
  ]}>
  Mode: {item.donation_mode} - Cadence: {item.cadence}
</Text>
```

**Step 4: Add VIEW THREAD link to history cards**

After the remaining `<Text style={historyMeta}>` (recipient + date), add:

```tsx
<Text
  style={[
    styles.historyThreadLink,
    {
      color: theme.colors.accent,
      fontFamily: theme.typography.brand,
    },
  ]}>
  {item.conversation_id ? 'VIEW THREAD →' : 'PROCESSING...'}
</Text>
```

Add to styles:

```typescript
historyThreadLink: {
  fontSize: 10,
  lineHeight: 14,
  letterSpacing: 0.8,
  fontWeight: '700',
  marginTop: 6,
},
```

**Step 5: Remove the dead-end history note**

Delete the `<Text>` block at the end of `renderDonationHistory` (lines ~442-453):

```tsx
// DELETE THIS:
<Text
  style={[
    styles.note,
    {
      color: theme.colors.textTertiary,
      fontFamily: theme.typography.brand,
    },
  ]}>
  My Glimpses uses live donation rows from Supabase.
</Text>
```

**Step 6: Clean up unused `note` style**

If both notes are removed (feed + history), delete the `note` style from the StyleSheet:

```typescript
// DELETE if no longer used:
note: {
  marginTop: 10,
  fontSize: 10,
  lineHeight: 14,
  letterSpacing: 0.2,
},
```

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 8: Commit**

```bash
git add screens/CampaignsScreen.tsx
git commit -m "feat: clean up history cards and add VIEW THREAD navigation"
```

---

### Task 4: Give Screen — Form Field Grouping

**Files:**
- Modify: `screens/GiveScreen.tsx:326-568` (form step rendering)
- Modify: `screens/GiveScreen.tsx:823-1019` (styles)

**Step 1: Add a divider + OPTIONAL label between required and optional fields**

In the form step (line ~327), after the Campaign field block (line ~491, closing `</View>` of the campaign fieldBlock), add:

```tsx
<View style={styles.optionalDivider}>
  <View
    style={[
      styles.optionalDividerLine,
      {backgroundColor: theme.colors.borderMuted},
    ]}
  />
  <Text
    style={[
      styles.optionalSectionLabel,
      {
        color: theme.colors.textTertiary,
        fontFamily: theme.typography.brand,
      },
    ]}>
    OPTIONAL
  </Text>
</View>
```

Add to styles:

```typescript
optionalDivider: {
  marginTop: 4,
  marginBottom: 14,
},
optionalDividerLine: {
  height: 1,
  marginBottom: 10,
},
optionalSectionLabel: {
  fontSize: 11,
  letterSpacing: 1.1,
},
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 3: Commit**

```bash
git add screens/GiveScreen.tsx
git commit -m "feat: add optional section divider in donation form"
```

---

### Task 5: Give Screen — Confirm Step Buttons + Timeline Copy

**Files:**
- Modify: `screens/GiveScreen.tsx:684-759` (timeline copy + buttons in confirm step)
- Modify: `screens/GiveScreen.tsx:954-993` (styles for timelineCopy, backButton, confirmButton)

**Step 1: Replace timeline paragraph with scannable bullet lines**

Find the `<Text style={timelineCopy}>` block (line ~685-694). Replace with:

```tsx
<View style={styles.timelineList}>
  <Text
    style={[
      styles.timelineItem,
      {color: theme.colors.textSecondary},
    ]}>
    {'—  '}On-chain confirmation is immediate
  </Text>
  <Text
    style={[
      styles.timelineItem,
      {color: theme.colors.textSecondary},
    ]}>
    {'—  '}24-48 hours: matched to a specific need
  </Text>
  <Text
    style={[
      styles.timelineItem,
      {color: theme.colors.textSecondary},
    ]}>
    {'—  '}5-7 days: receipts, photos, and updates
  </Text>
</View>
```

Add to styles (replace `timelineCopy`):

```typescript
timelineList: {
  marginTop: 12,
  gap: 4,
},
timelineItem: {
  fontSize: 14,
  lineHeight: 20,
},
```

Delete old `timelineCopy` style.

**Step 2: Restyle Back button — ghost, full width, stacked above Confirm**

Find the Back `<Pressable>` (line ~702-727). Change the style:

```tsx
<Pressable
  onPress={() => transitionToStep('form')}
  disabled={loading || connecting}
  style={({pressed}) => [
    styles.backButton,
    {
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
      opacity: loading || connecting ? 0.6 : 1,
      transform: [
        {scale: pressed ? 0.985 : 1},
        {translateY: pressed ? 1 : 0},
      ],
    },
  ]}>
  <Text
    style={[
      styles.backButtonText,
      {
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.brand,
      },
    ]}>
    BACK
  </Text>
</Pressable>
```

Update `backButton` style:

```typescript
backButton: {
  marginTop: 14,
  width: '100%',
  height: 48,
  borderWidth: 2,
  alignItems: 'center',
  justifyContent: 'center',
},
```

Update `backButtonText`:

```typescript
backButtonText: {
  fontSize: 15,
  lineHeight: 18,
  fontWeight: '700',
  letterSpacing: 1,
},
```

**Step 3: Remove pill radius from Confirm button**

In the `confirmButton` style (line ~974-987), change:

```typescript
// OLD
borderRadius: 32,

// NEW
borderRadius: 0,
```

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 5: Commit**

```bash
git add screens/GiveScreen.tsx
git commit -m "feat: scannable timeline copy and balanced confirm step buttons"
```

---

### Task 6: Give Screen — Processing State Enhancement

**Files:**
- Modify: `screens/GiveScreen.tsx:761-816` (processing step rendering)

**Step 1: Wrap processing state in SurfaceCard with prominent amount**

Import `SurfaceCard` is already present in GiveScreen. Replace the processing step body (line ~762-815):

```tsx
) : step === 'processing' ? (
  <View>
    <SurfaceCard style={styles.processingCard}>
      <Text
        style={[
          styles.processingTitle,
          {
            color: theme.colors.textPrimary,
            fontFamily: theme.typography.brand,
          },
        ]}>
        DONATION CONFIRMED
      </Text>
      <Text
        style={[
          styles.processingAmount,
          {
            color: theme.colors.accent,
            fontFamily: theme.typography.brand,
          },
        ]}>
        {formattedAmount} USDC
      </Text>
      <Text
        style={[
          styles.processingBody,
          {color: theme.colors.textSecondary},
        ]}>
        Your donation is confirmed on-chain. We are processing your
        message thread — it will appear in Messages shortly.
      </Text>
    </SurfaceCard>

    {!!processingTxSig && (
      <TouchableOpacity
        onPress={() =>
          Linking.openURL(getExplorerUrl(processingTxSig))
        }
        activeOpacity={0.7}
        style={[
          styles.explorerLink,
          {borderColor: theme.colors.border},
        ]}>
        <Text
          style={[
            styles.explorerLinkText,
            {
              color: theme.colors.accent,
              fontFamily: theme.typography.brand,
            },
          ]}>
          View on Solana Explorer
        </Text>
      </TouchableOpacity>
    )}

    <PrimaryButton
      label="Done"
      onPress={() => {
        reset();
        navigation.navigate('Messages');
      }}
      style={styles.reviewButton}
    />
  </View>
) : null}
```

Add to styles:

```typescript
processingCard: {
  marginBottom: 16,
  borderRadius: 0,
},
processingAmount: {
  fontSize: 28,
  lineHeight: 34,
  fontWeight: '700',
  marginBottom: 12,
},
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 3: Commit**

```bash
git add screens/GiveScreen.tsx
git commit -m "feat: enhance processing state with SurfaceCard and prominent amount"
```

---

### Task 7: Animation Duration Normalization

**Files:**
- Modify: `screens/GiveScreen.tsx:95-101` (animateFieldFocus: 120→100ms)
- Modify: `screens/GiveScreen.tsx:179-193` (transitionToStep: 120→250ms exit, 220→250ms enter)
- Modify: `screens/GiveScreen.tsx:203-208` (openCampaignMenu: 190→180ms)
- Modify: `screens/GiveScreen.tsx:217-226` (closeCampaignMenu: 150→180ms)
- Modify: `screens/MessagesScreen.tsx:180-185` (MessageBubble enter: 210→180ms)
- Modify: `screens/MessagesScreen.tsx:739-752` (sendPulse: 90→100ms, 130→100ms)
- Modify: `navigation/AppNavigator.tsx:105-110` (glimpsesIndicator: 180ms — already correct)
- Modify: `navigation/AppNavigator.tsx:113-120` (messagesIndicator: 180ms — already correct)

Three tiers: Fast=100ms, Medium=180ms, Slow=250ms.

**Step 1: GiveScreen — field focus 120→100ms**

Find `animateFieldFocus` (line ~94-101). Change:

```typescript
duration: 100, // was 120
```

**Step 2: GiveScreen — step transition exit 120→250ms, enter 220→250ms**

Find `transitionToStep` (line ~179-193). Change the exit:

```typescript
duration: 250, // was 120
```

And the enter callback:

```typescript
duration: 250, // was 220
```

**Step 3: GiveScreen — campaign menu open 190→180ms**

Find `openCampaignMenu` (line ~203-208). Change:

```typescript
duration: 180, // was 190
```

**Step 4: GiveScreen — campaign menu close 150→180ms**

Find `closeCampaignMenu` (line ~217-226). Change:

```typescript
duration: 180, // was 150
```

**Step 5: MessagesScreen — bubble enter 210→180ms**

Find `MessageBubble` enterMotion timing (line ~180-185). Change:

```typescript
duration: 180, // was 210
```

**Step 6: MessagesScreen — send pulse 90/130→100/100ms**

Find `handleSend` send pulse sequence (line ~739-752). Change both:

```typescript
duration: 100, // was 90  (first timing)
// ...
duration: 100, // was 130 (second timing)
```

**Step 7: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 8: Commit**

```bash
git add screens/GiveScreen.tsx screens/MessagesScreen.tsx
git commit -m "refactor: normalize animation durations to 3-tier system (100/180/250ms)"
```

---

### Task 8: Tab Bar Theme Deduplication

**Files:**
- Modify: `navigation/AppNavigator.tsx:27-46` (remove TAB_BAR_THEME)
- Modify: `navigation/AppNavigator.tsx:52-82` (icon components — accept theme prop)
- Modify: `navigation/AppNavigator.tsx:84-238` (AppTabBar — use useTheme)
- Modify: `navigation/AppNavigator.tsx:303-382` (AppNavigator — use useTheme)

**Step 1: Add useTheme import and remove TAB_BAR_THEME**

Add import at top:

```typescript
import {useTheme} from '../theme/Theme';
```

Delete the entire `TAB_BAR_THEME` const (lines ~38-46).

**Step 2: Thread theme into AppTabBar**

In `AppTabBar`, add `useTheme` at the top:

```typescript
const {theme} = useTheme();
```

Replace all `TAB_BAR_THEME.background` with `theme.colors.surface`, `TAB_BAR_THEME.border` with `theme.colors.border`, `TAB_BAR_THEME.textPrimary` with `theme.colors.textPrimary`, `TAB_BAR_THEME.textTertiary` with `theme.colors.textTertiary`, `TAB_BAR_THEME.accent` with `theme.colors.accent`, `TAB_BAR_THEME.accentPressed` with `theme.colors.accentPressed`, `TAB_BAR_THEME.brand` with `theme.typography.brand`.

**Step 3: Thread theme into icon components**

Change `GlimpsesIcon` and `MessagesIcon` to accept `theme` prop or use `useTheme`:

```typescript
function GlimpsesIcon({active}: {active: boolean}) {
  const {theme} = useTheme();
  const iconColor = active ? theme.colors.textPrimary : theme.colors.textTertiary;
  // ... rest unchanged
}
```

Same for `MessagesIcon`.

**Step 4: Thread theme into AppNavigator**

In `AppNavigator`, add `const {theme} = useTheme();` and replace all `TAB_BAR_THEME.*` references in the help button.

**Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 6: Commit**

```bash
git add navigation/AppNavigator.tsx
git commit -m "refactor: replace TAB_BAR_THEME with useTheme for consistency"
```

---

### Task 9: MessagesScreen — Replace Hardcoded Colors

**Files:**
- Modify: `screens/MessagesScreen.tsx` (multiple inline hardcoded colors)

**Step 1: Replace chat top card hardcoded colors (line ~778-781)**

```typescript
// OLD
backgroundColor: 'rgba(26,17,37,0.04)',
borderColor: 'rgba(26,17,37,0.12)',

// NEW
backgroundColor: theme.colors.surfaceMuted,
borderColor: theme.colors.borderMuted,
```

**Step 2: Replace admin bubble background (line ~860)**

```typescript
// OLD
adminBubbleBackground="rgba(26,17,37,0.06)"
adminBubbleBorder="rgba(26,17,37,0.14)"

// NEW
adminBubbleBackground={theme.colors.surfaceMuted}
adminBubbleBorder={theme.colors.borderMuted}
```

**Step 3: Replace input bar hardcoded colors (line ~891-895)**

```typescript
// OLD
borderTopColor: 'rgba(101,84,209,0.2)',
backgroundColor: 'rgba(101,84,209,0.1)',

// NEW — keep accent-tinted bar, use theme accent with opacity
borderTopColor: theme.colors.borderMuted,
backgroundColor: theme.colors.surfaceMuted,
```

**Step 4: Replace media button hardcoded colors (line ~901-903, 913-915)**

```typescript
// OLD
borderColor: 'rgba(101,84,209,0.32)',
backgroundColor: '#F4F1FF',

// NEW
borderColor: theme.colors.borderMuted,
backgroundColor: theme.colors.surface,
```

**Step 5: Replace chat input hardcoded colors (line ~926-929)**

```typescript
// OLD
backgroundColor: '#FFFFFF',
color: '#1A1125',
borderColor: 'rgba(141,125,199,0.45)',

// NEW — use a light surface for input
backgroundColor: theme.mode === 'light' ? '#FFFFFF' : theme.colors.surface,
color: theme.colors.textPrimary,
borderColor: theme.colors.borderMuted,
```

**Step 6: Replace send button hardcoded colors (line ~944-949)**

```typescript
// OLD
backgroundColor: '#6554D1',
// disabled:
backgroundColor: '#BFB5ED',
borderColor: 'rgba(101,84,209,0.35)',

// NEW
backgroundColor: theme.colors.accent,
// disabled:
backgroundColor: theme.colors.textTertiary,
borderColor: theme.colors.borderMuted,
```

**Step 7: Replace donor bubble text hardcoded colors (line ~865-867)**

```typescript
// OLD
donorTextColor="rgba(248,244,255,0.98)"
donorTimeColor="rgba(244,240,255,0.74)"

// NEW — keep light-on-accent contrast
donorTextColor={theme.mode === 'light' ? 'rgba(248,244,255,0.98)' : '#F7FAFC'}
donorTimeColor={theme.mode === 'light' ? 'rgba(244,240,255,0.74)' : 'rgba(247,250,252,0.6)'}
```

**Step 8: Replace media tag hardcoded color (line ~1077)**

```typescript
// OLD (in StyleSheet)
color: '#4D41A8',

// NEW — apply inline with theme
```

Move `mediaTagText` color to inline and use `theme.colors.accent`.

**Step 9: Replace conversation unread badge hardcoded color (line ~1241)**

```typescript
// OLD (in StyleSheet)
backgroundColor: '#6554D1',

// NEW — apply inline
```

Move to inline: `backgroundColor: theme.colors.accent`.

**Step 10: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 11: Commit**

```bash
git add screens/MessagesScreen.tsx
git commit -m "refactor: replace MessagesScreen hardcoded colors with theme tokens"
```

---

### Task 10: Final Verification

**Step 1: Run full quality gate**

```bash
npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings=0 && npm test -- --watchAll=false
```

Expected: all pass, zero warnings

**Step 2: Run bundle check**

```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

Expected: bundle succeeds with no errors

**Step 3: Commit any lint/type fixes if needed**

```bash
git add -A
git commit -m "chore: fix lint/type issues from UI polish pass"
```

---

### Task 11: Clean Up Unused Styles

**Files:**
- Modify: `screens/CampaignsScreen.tsx` (remove dead styles)

**Step 1: Remove unused styles from CampaignsScreen**

After all edits, these styles may be orphaned (verify before deleting):
- `activityList`, `activityRow`, `avatar`, `avatarText`, `rowBody`, `rowTitle`, `rowMeta`, `stageRow`, `stageDot`, `stageText`, `amount`
- `togglePillActive` (if moved to inline)
- `note` (if both notes deleted)

Grep for each name in the file. Delete any that have zero references outside the StyleSheet.

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no new errors

**Step 3: Commit**

```bash
git add screens/CampaignsScreen.tsx
git commit -m "chore: remove unused styles from CampaignsScreen"
```
