# Proof-First Feed Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Default operating skill: `solana-seeker-dev` v2.1 — check all changes against Solana playbook.
> Design skill: `interface-design` — check all UI changes against craft principles.

**Goal:** Redesign every Glimpse screen around blockchain proof as the product, with connection-forward UX.

**Architecture:** UI-only changes. Theme tokens, a new ProofCard component, and restyled screens. No backend, transaction, or data model changes.

**Tech Stack:** React Native 0.76.5, TypeScript, Animated API (useNativeDriver where possible)

**Design doc:** `docs/plans/2026-03-05-proof-first-redesign-design.md`

**Quality gate (run after every task):**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

**Bundle check (run after Tasks 1 and 7):**

```bash
CI=true npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/glimpse.bundle
```

---

## Task 1: Theme Token Pass + Typography Consistency

Update theme tokens to match the brand guide. Restore border radius from `0` to brand spec. Add Cormorant Garamond to typography tokens. Replace brutalist hard-offset shadows with subtle elevation.

**Files:**
- Modify: `theme/Theme.tsx`
- Modify: `ui/SurfaceCard.tsx`
- Modify: `ui/PrimaryButton.tsx`
- Modify: `ui/AppHeader.tsx`
- Reference: `docs/design/brand-guide.md` (radius scale, shadow spec, typography)

**Step 1: Update `theme/Theme.tsx` — AppTheme interface**

Add `display` font family to the typography interface:

```typescript
// theme/Theme.tsx — update AppTheme.typography type
typography: {
  brand: string;       // CourierPrime-Regular (labels, buttons, metadata)
  display: string;     // CormorantGaramond-Light (amounts, headlines)
  displayRegular: string; // CormorantGaramond-Regular (card amounts)
  body: string;        // CourierPrime-Regular (body text — same as brand)
  title: number;
  h2: number;
  h3: number;
  bodySize: number;
  caption: number;
  label: number;
};
```

**Step 2: Update `theme/Theme.tsx` — radius values**

```typescript
// Both light and dark themes share:
radius: {
  sm: 6,    // was 0 — badges, status pills
  md: 10,   // was 0 — buttons, inputs
  lg: 16,   // was 0 — cards, panels
  xl: 18,   // was 0 — modals, sheets
  pill: 999, // unchanged
},
```

**Step 3: Update `theme/Theme.tsx` — typography values**

```typescript
// Both light and dark themes share:
typography: {
  brand: 'CourierPrime-Regular',
  display: 'CormorantGaramond-Light',
  displayRegular: 'CormorantGaramond-Regular',
  body: 'CourierPrime-Regular',
  title: 36,       // was 44 — section headings in Cormorant
  h2: 28,          // unchanged
  h3: 22,          // unchanged
  bodySize: 15,    // was 18 — tighter body
  caption: 13,     // was 14
  label: 11,       // was 12
},
```

**Step 4: Update `theme/Theme.tsx` — shadow system**

Replace hard-offset brutalist shadows:

```typescript
// lightTheme.shadows
shadows: {
  subtle: createShadow('#1A1125', 0.06, 4, 0, 2, 2),
  card: createShadow('#1A1125', 0.1, 12, 0, 6, 3),
  press: createShadow('#1A1125', 0.06, 2, 0, 1, 1),
},

// darkTheme.shadows
shadows: {
  subtle: createShadow('#000000', 0.15, 4, 0, 2, 2),
  card: createShadow('#000000', 0.25, 12, 0, 4, 3),
  press: createShadow('#000000', 0.15, 2, 0, 1, 1),
},
```

**Step 5: Update `ui/SurfaceCard.tsx` — reduce border weight**

Change `borderWidth: 3` to `borderWidth: 1`. Use `borderColor: theme.colors.borderMuted` instead of `theme.colors.border`. This matches glass surface aesthetic — whisper-quiet borders.

```typescript
// SurfaceCard.tsx
const styles = StyleSheet.create({
  card: {
    borderWidth: 1, // was 3
  },
});

// In component, change borderColor:
borderColor: theme.colors.borderMuted, // was theme.colors.border
borderRadius: theme.radius.lg,         // was theme.radius.sm
```

**Step 6: Update `ui/PrimaryButton.tsx` — typography + radius**

```typescript
// PrimaryButton.tsx — text style
fontSize: 14,          // was 22
letterSpacing: 1.1,    // was 1
// borderRadius already uses theme.radius.sm which is now 6
// Change to theme.radius.md (10) for buttons:
borderRadius: theme.radius.md, // was theme.radius.sm
borderWidth: 1.5,              // was 2
minHeight: 48,                 // was 54
```

**Step 7: Update `ui/AppHeader.tsx` — proportional title**

```typescript
// AppHeader.tsx — title style
fontSize: 28,         // was 44
lineHeight: 34,       // was 52
letterSpacing: 4,     // was 8
fontFamily: theme.typography.display, // was theme.typography.brand

// rule style
height: 2,            // was 3
marginTop: 6,         // was 8
```

**Step 8: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

Expected: All pass. TypeScript may flag `display`/`displayRegular` as missing on the interface — fix the interface first (Step 1).

**Step 9: Run bundle check**

```bash
CI=true npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/glimpse.bundle
```

Expected: Bundle succeeds. This catches any font reference issues early.

**Step 10: Commit**

```bash
git add theme/Theme.tsx ui/SurfaceCard.tsx ui/PrimaryButton.tsx ui/AppHeader.tsx
git commit -m "feat: update theme tokens — radius, shadows, typography for proof-first redesign"
```

---

## Task 2: Proof Card Component + 3-State Verification Model

Create the signature `ProofCard` component with verified/pending/unavailable states.

**Files:**
- Create: `ui/ProofCard.tsx`
- Reference: `services/helius.ts` (EnhancedDonation type)
- Reference: `data/donationConfig.ts` (getRecipientLabel)
- Reference: `utils/explorer.ts` (getExplorerUrl)
- Reference: `docs/plans/2026-03-05-proof-first-redesign-design.md` (Proof Card anatomy)

**Step 1: Create `ui/ProofCard.tsx`**

```typescript
import React from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../theme/Theme';
import {getRecipientLabel} from '../data/donationConfig';
import {getExplorerUrl} from '../utils/explorer';
import type {EnhancedDonation} from '../services/helius';

type VerificationState = 'verified' | 'pending' | 'unavailable';

interface ProofCardProps {
  amountUsdc: number;
  recipientId: string;
  txSignature: string;
  createdAt: string;
  donorWallet?: string;
  status: string;
  enhanced?: EnhancedDonation;
  enhancedLoading?: boolean;
  onPress?: () => void;
  action?: {label: string; onPress: () => void};
  compact?: boolean;
  style?: ViewStyle;
}

function getVerificationState(
  enhanced?: EnhancedDonation,
  enhancedLoading?: boolean,
): VerificationState {
  if (enhancedLoading) return 'pending';
  if (enhanced?.verified === true) return 'verified';
  return 'unavailable';
}

export default function ProofCard({
  amountUsdc,
  recipientId,
  txSignature,
  createdAt,
  donorWallet,
  status,
  enhanced,
  enhancedLoading,
  onPress,
  action,
  compact = false,
  style,
}: ProofCardProps) {
  const {theme} = useTheme();
  const verification = getVerificationState(enhanced, enhancedLoading);
  const recipient = getRecipientLabel(recipientId);
  const truncatedWallet = donorWallet
    ? `${donorWallet.slice(0, 4)}...${donorWallet.slice(-4)}`
    : '';
  const dateStr = new Date(createdAt).toLocaleDateString();

  const accentColor =
    verification === 'verified' ? theme.colors.teal : 'transparent';

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderMuted,
          borderRadius: theme.radius.lg,
        },
        theme.shadows.card,
        style,
      ]}>
      {/* Teal left accent */}
      {verification === 'verified' && (
        <View
          style={[
            styles.leftAccent,
            {
              backgroundColor: accentColor,
              borderTopLeftRadius: theme.radius.lg,
              borderBottomLeftRadius: theme.radius.lg,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.inner,
          {paddingLeft: verification === 'verified' ? 16 : 12},
        ]}>
        {/* Top row: amount + verification */}
        <View style={styles.topRow}>
          <Text
            style={[
              compact ? styles.amountCompact : styles.amount,
              {
                color: theme.colors.textPrimary,
                fontFamily: compact
                  ? theme.typography.displayRegular
                  : theme.typography.display,
              },
            ]}>
            ${amountUsdc.toFixed(2)} USDC
          </Text>
          {verification === 'verified' && (
            <View
              style={[
                styles.verifiedBadge,
                {
                  backgroundColor: theme.colors.teal + '14',
                  borderColor: theme.colors.teal + '40',
                },
              ]}>
              <View style={styles.shield}>
                <View
                  style={[
                    styles.shieldBody,
                    {backgroundColor: theme.colors.teal},
                  ]}
                />
                <View
                  style={[
                    styles.shieldPoint,
                    {borderTopColor: theme.colors.teal},
                  ]}
                />
                <Text
                  style={[
                    styles.shieldLetter,
                    {color: '#F3EFFF', fontFamily: theme.typography.brand},
                  ]}>
                  G
                </Text>
              </View>
              <Text
                style={[
                  styles.verifiedText,
                  {
                    color: theme.colors.teal,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                VERIFIED ON-CHAIN
              </Text>
            </View>
          )}
          {verification === 'pending' && (
            <View style={styles.pendingRow}>
              <ActivityIndicator
                size="small"
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.pendingText,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                CONFIRMING...
              </Text>
            </View>
          )}
        </View>

        {/* Meta row: wallet / recipient */}
        <Text
          style={[styles.meta, {color: theme.colors.textSecondary}]}
          numberOfLines={1}>
          {donorWallet ? `${truncatedWallet} — ` : ''}
          {recipient}
          {!donorWallet ? ` — ${dateStr}` : ''}
        </Text>

        {/* Footer row: explorer link + action */}
        {!compact && (
          <View style={styles.footerRow}>
            {txSignature ? (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  Linking.openURL(getExplorerUrl(txSignature))
                }>
                <Text
                  style={[
                    styles.explorerLink,
                    {
                      color: theme.colors.teal,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  View on Explorer {'\u2197'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            {donorWallet && !action && (
              <Text
                style={[styles.dateText, {color: theme.colors.textTertiary}]}>
                {dateStr}
              </Text>
            )}
            {action && (
              <TouchableOpacity activeOpacity={0.85} onPress={action.onPress}>
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.84} onPress={onPress}>
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  inner: {
    paddingRight: 12,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amount: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '300',
  },
  amountCompact: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '400',
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shield: {
    width: 14,
    height: 15,
    position: 'relative',
    alignItems: 'center',
  },
  shieldBody: {
    width: 12,
    height: 9,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  shieldPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  shieldLetter: {
    position: 'absolute',
    top: 0,
    fontSize: 7,
    lineHeight: 9,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verifiedText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pendingText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'CourierPrime-Regular',
    marginBottom: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  explorerLink: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'CourierPrime-Regular',
  },
  actionText: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
```

**Step 2: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

Expected: All pass. ProofCard is not yet consumed — no integration risk.

**Step 3: Commit**

```bash
git add ui/ProofCard.tsx
git commit -m "feat: add ProofCard component with 3-state verification model"
```

---

## Task 3: Glimpses Feed Conversion to Proof Cards

Replace inline card rendering in CampaignsScreen with ProofCard. Refine segmented control.

**Files:**
- Modify: `screens/CampaignsScreen.tsx`
- Reference: `ui/ProofCard.tsx` (new component)
- Reference: `services/helius.ts` (EnhancedDonation)
- Reference: `services/chat.ts` (DonationHistoryItem)

**Step 1: Replace inline card rendering with ProofCard**

In `CampaignsScreen.tsx`, replace the entire `renderDonationList` function's card rendering section (`rows.map(item => { ... })`) with ProofCard usage:

```typescript
// At top, add import:
import ProofCard from '../ui/ProofCard';

// In renderDonationList, replace the rows.map block:
return (
  <View style={styles.historyWrap}>
    {rows.map(item => {
      const enhanced = enhancedData?.get(item.tx_signature);

      if (showDonorWallet) {
        // Feed mode — no onPress, no action, shows donor wallet
        return (
          <ProofCard
            key={item.id}
            amountUsdc={item.amount_usdc}
            recipientId={item.recipient_id}
            txSignature={item.tx_signature}
            createdAt={item.created_at}
            donorWallet={item.donor_wallet}
            status={item.status}
            enhanced={enhanced}
          />
        );
      }

      // My Glimpses mode — onPress navigates to thread, shows action
      return (
        <ProofCard
          key={item.id}
          amountUsdc={item.amount_usdc}
          recipientId={item.recipient_id}
          txSignature={item.tx_signature}
          createdAt={item.created_at}
          status={item.status}
          enhanced={enhanced}
          onPress={() => {
            if (item.conversation_id) {
              navigation.navigate('Messages', {
                conversationId: item.conversation_id,
              });
            } else {
              navigation.navigate('Messages');
            }
          }}
          action={
            item.conversation_id
              ? {
                  label: 'VIEW THREAD \u2192',
                  onPress: () =>
                    navigation.navigate('Messages', {
                      conversationId: item.conversation_id,
                    }),
                }
              : undefined
          }
        />
      );
    })}
  </View>
);
```

**Step 2: Refine segmented control**

Update the toggle styles in `CampaignsScreen.tsx`:

```typescript
// Update toggle styles:
toggle: {
  borderWidth: 1,       // was 2
  borderRadius: 10,     // was 0 — now uses brand guide button radius
  flexDirection: 'row',
  alignItems: 'center',
  overflow: 'hidden',
},
togglePill: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  borderRadius: 8,      // inner pill radius
  marginHorizontal: 2,
  marginVertical: 2,
},
```

And update the toggle `borderColor` from `theme.colors.border` to `theme.colors.borderMuted`.

**Step 3: Update panel card styling**

```typescript
panel: {
  marginBottom: 18,
  borderRadius: 16,   // keep
  borderWidth: 1,     // was 2
  paddingTop: 14,
  paddingHorizontal: 12,
  paddingBottom: 12,
},
```

**Step 4: Remove old card styles that are now in ProofCard**

Remove these styles from CampaignsScreen since they're replaced by ProofCard internals:
- `historyCard`
- `historyTopRow`
- `historyAmount`
- `historyStatus`
- `historyMeta`
- `historyActions`
- `historyThreadLink`
- `explorerLink`
- `statusRow`
- `verifiedBadge`, `verifiedShield`, `verifiedShieldBody`, `verifiedShieldPoint`, `verifiedShieldLetter`, `verifiedText`

Keep: `historyWrap`, `stateCard`, `centeredState`, `stateText`, `stateLink`.

**Step 5: Remove old imports that are now in ProofCard**

Remove from CampaignsScreen imports: `getRecipientLabel`, `DONATION_STATUS_LABELS`, `getExplorerUrl`, `Linking`. These are now consumed inside ProofCard.

**Step 6: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

**Step 7: Commit**

```bash
git add screens/CampaignsScreen.tsx
git commit -m "feat: convert glimpses feed to ProofCard components"
```

---

## Task 4: Home Screen Rewrite (Connection Focus)

Rewrite HomeScreen with connection-forward copy, G mark breathing animation, refined typography.

**Files:**
- Modify: `screens/HomeScreen.tsx`
- Reference: `docs/SOUL.md` (founder voice lines)
- Reference: `docs/design/brand-guide.md` (G mark SVG, animation specs)

**Step 1: Rewrite `screens/HomeScreen.tsx`**

Replace the entire file:

```typescript
import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Pressable, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/Theme';

export default function HomeScreen({onContinue}: {onContinue: () => void}) {
  const {theme} = useTheme();
  const breathe = useRef(new Animated.Value(0.85)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // G mark breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0.85,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Content fade in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [breathe, fadeIn]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        {/* G Lettermark */}
        <Animated.View style={[styles.gMarkWrap, {opacity: breathe}]}>
          <View
            style={[
              styles.gMarkCircle,
              {borderColor: theme.colors.accent},
            ]}
          />
          <View
            style={[
              styles.gMarkBar,
              {backgroundColor: theme.colors.accent},
            ]}
          />
        </Animated.View>

        <Animated.View style={[styles.textBlock, {opacity: fadeIn}]}>
          {/* Kicker */}
          <Text
            style={[
              styles.kicker,
              {
                color: theme.colors.textTertiary,
                fontFamily: theme.typography.brand,
              },
            ]}>
            DOCUMENTING KINDNESS
          </Text>

          {/* Connection copy */}
          <Text
            style={[
              styles.headline,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.display,
              },
            ]}>
            Give. See the proof.{'\n'}Start a conversation.
          </Text>

          {/* Subtle 3-step reference */}
          <View style={styles.stepsRow}>
            {['GIVE', 'CONFIRM', 'SEE PROOF'].map((step, i) => (
              <React.Fragment key={step}>
                <Text
                  style={[
                    styles.stepText,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {step}
                </Text>
                {i < 2 && (
                  <Text
                    style={[styles.stepArrow, {color: theme.colors.textTertiary}]}>
                    {'\u2192'}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{opacity: fadeIn, width: '100%', maxWidth: 420}}>
          <Pressable
            onPress={onContinue}
            style={({pressed}) => [
              styles.cta,
              {
                backgroundColor: theme.colors.accent,
                borderColor: theme.colors.borderMuted,
                borderRadius: theme.radius.md,
                transform: [{scale: pressed ? 0.985 : 1}],
              },
              theme.shadows.card,
            ]}>
            <Text
              style={[
                styles.ctaText,
                {fontFamily: theme.typography.brand},
              ]}>
              GIVE A GLIMPSE
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  gMarkWrap: {
    width: 64,
    height: 64,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  gMarkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    borderStyle: 'solid',
    // Broken circle effect via border dash (approximated with a gap)
    // React Native doesn't support stroke-dasharray natively,
    // so we use a near-complete circle border
  },
  gMarkBar: {
    position: 'absolute',
    right: 4,
    width: 16,
    height: 2.5,
    borderRadius: 1,
  },
  textBlock: {
    alignItems: 'center',
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 3,
    fontWeight: '400',
  },
  headline: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '300',
    textAlign: 'center',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  stepText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  stepArrow: {
    fontSize: 10,
    lineHeight: 12,
  },
  cta: {
    width: '100%',
    borderWidth: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#F3EFFF',
    fontSize: 14,
    lineHeight: 16,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
});
```

**Step 2: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

**Step 3: Commit**

```bash
git add screens/HomeScreen.tsx
git commit -m "feat: rewrite home screen — connection-forward copy, G mark breathing animation"
```

---

## Task 5: Give Flow Visual Simplification (Same Backend)

Add quick-select amount pills, collapse optional fields, update typography. Backend logic untouched.

**Files:**
- Modify: `screens/GiveScreen.tsx`
- Reference: `data/donationConfig.ts` (CAMPAIGN_OPTIONS — unchanged)
- Reference: `services/donations.ts` (executeDonationSeamless — unchanged)

**Step 1: Add quick-select pills**

Add after the amount input field (after the `amountWrap` View, before the campaign field block):

```typescript
// Quick-select amount pills — add inside the first fieldBlock, after amountWrap
const QUICK_AMOUNTS = [5, 10, 25, 50];

// In the JSX, after the amountWrap Animated.View:
<View style={styles.quickPills}>
  {QUICK_AMOUNTS.map(amt => {
    const active = amount === amt;
    return (
      <Pressable
        key={amt}
        onPress={() => setAmountInput(String(amt))}
        style={[
          styles.quickPill,
          {
            backgroundColor: active
              ? theme.colors.accent + '18'
              : theme.colors.surfaceMuted,
            borderColor: active
              ? theme.colors.accent
              : theme.colors.borderMuted,
            borderRadius: theme.radius.sm,
          },
        ]}>
        <Text
          style={[
            styles.quickPillText,
            {
              color: active
                ? theme.colors.accent
                : theme.colors.textSecondary,
              fontFamily: theme.typography.brand,
            },
          ]}>
          ${amt}
        </Text>
      </Pressable>
    );
  })}
</View>
```

Add styles:

```typescript
quickPills: {
  flexDirection: 'row',
  gap: 8,
  marginTop: 8,
},
quickPill: {
  flex: 1,
  borderWidth: 1,
  minHeight: 36,
  alignItems: 'center',
  justifyContent: 'center',
},
quickPillText: {
  fontSize: 13,
  lineHeight: 16,
  fontWeight: '700',
  letterSpacing: 0.3,
},
```

**Step 2: Update amount display typography**

In the `amountInput` style:

```typescript
amountInput: {
  flex: 1,
  fontSize: 34,     // keep size
  lineHeight: 40,
  fontWeight: '300', // was '700' — lighter for Cormorant feel
  paddingVertical: 8,
},
```

And update the `fontFamily` on the amountInput in JSX to `theme.typography.display` (Cormorant Garamond Light):

```typescript
style={[
  styles.amountInput,
  {
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.display, // was theme.typography.brand
  },
]}
```

Same for `amountPrefix`:
```typescript
fontFamily: theme.typography.display, // was theme.typography.brand
fontWeight: '300', // was '700'
```

**Step 3: Collapse optional fields**

Add state for optional field visibility:

```typescript
const [showOptional, setShowOptional] = useState(false);
```

Replace the `optionalDivider` View and both optional field blocks with:

```typescript
<TouchableOpacity
  onPress={() => setShowOptional(v => !v)}
  style={styles.optionalToggle}
  activeOpacity={0.8}>
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
    {showOptional ? 'HIDE OPTIONS \u25B4' : 'ADD A NOTE \u25BE'}
  </Text>
</TouchableOpacity>

{showOptional && (
  <>
    {/* Match context field — unchanged */}
    {/* Recipient note field — unchanged */}
  </>
)}
```

Add style:

```typescript
optionalToggle: {
  marginTop: 4,
  marginBottom: 14,
},
```

**Step 4: Update processing step to receipt moment**

In the `step === 'processing'` branch, update the title and add explicit CTA:

```typescript
// Replace processingTitle text:
DONATION CONFIRMED  // keep

// Update processingAmount to use display font:
style={[
  styles.processingAmount,
  {
    color: theme.colors.accent,
    fontFamily: theme.typography.display, // was theme.typography.brand
  },
]}

// Replace single "Done" button with two explicit CTAs:
{!!result.data?.conversationId && (
  <PrimaryButton
    label="View Your Thread"
    onPress={() => {
      const convId = processingConversationId;
      reset();
      if (convId) navigation.navigate('Messages', {conversationId: convId});
      else navigation.navigate('Messages');
    }}
    style={styles.reviewButton}
  />
)}

<PrimaryButton
  label="Done"
  variant="secondary"
  onPress={() => {
    reset();
    navigation.navigate('Glimpses');
  }}
  style={{marginTop: 8}}
/>
```

Note: you'll need to capture `conversationId` from the donation result. Add state:

```typescript
const [processingConversationId, setProcessingConversationId] = useState('');
```

And in `runDonation`, alongside `setProcessingTxSig`:

```typescript
if (conversationId) {
  setProcessingConversationId(conversationId);
}
```

**Step 5: Update field border widths**

All field `borderWidth: 2` values → `borderWidth: 1`:
- `amountWrap`
- `dropdownTrigger`
- `dropdownList`
- `multilineInput`
- `reviewRow`
- `backButton`
- `confirmButton` (change `borderWidth: 3` to `borderWidth: 1.5`)

**Step 6: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

**Step 7: Commit**

```bash
git add screens/GiveScreen.tsx
git commit -m "feat: give flow polish — quick-select pills, collapsible notes, receipt moment"
```

---

## Task 6: Messages Polish + Donation Context Card

Add compact ProofCard at thread header. Refine bubble and thread list styling.

**Files:**
- Modify: `screens/MessagesScreen.tsx`
- Reference: `ui/ProofCard.tsx` (compact variant)
- Reference: `services/helius.ts` (fetchEnhancedTransactions)

**Step 1: Add ProofCard import and enhanced data fetch**

At the top of MessagesScreen.tsx, add:

```typescript
import ProofCard from '../ui/ProofCard';
import {fetchEnhancedTransactions, type EnhancedDonation} from '../services/helius';
```

**Step 2: Add donation context card to chat view**

Inside the ChatView component (the part that renders when a conversation is selected), find where the message FlatList is rendered. Above it, add a compact ProofCard that shows the donation linked to this conversation:

```typescript
// Inside ChatView, where conversation data is available:
// Add state for enhanced data:
const [threadEnhanced, setThreadEnhanced] = useState<EnhancedDonation | undefined>();

// Add useEffect to fetch enhanced data for this conversation's tx:
useEffect(() => {
  if (!conversation?.donation_id) return;
  // The conversation object should have access to the donation's tx_signature
  // If available via the conversations query join, fetch enhanced data
  const sig = conversationTxSignature; // pulled from conversation metadata
  if (!sig) return;
  let cancelled = false;
  fetchEnhancedTransactions([sig])
    .then(data => {
      if (!cancelled) setThreadEnhanced(data.get(sig));
    })
    .catch(() => {});
  return () => { cancelled = true; };
}, [conversationTxSignature]);
```

Add the ProofCard above the message list:

```typescript
{conversation && (
  <ProofCard
    compact
    amountUsdc={conversation.amount_usdc ?? 0}
    recipientId={conversation.recipient_id ?? 'general'}
    txSignature={conversation.tx_signature ?? ''}
    createdAt={conversation.created_at}
    status="confirmed"
    enhanced={threadEnhanced}
    style={{marginHorizontal: 12, marginTop: 8, marginBottom: 4}}
  />
)}
```

Note: The exact shape of the `conversation` object depends on how `fetchConversations` joins donation data. Check `services/chat.ts` — if `tx_signature` and `amount_usdc` aren't on the Conversation type, you'll need to either extend the query or skip the context card for now and leave a TODO.

**Step 3: Refine thread list card styling**

Update the conversation list card borders and surface to match glass aesthetic:

```typescript
// In the conversation list item styles:
borderWidth: 1,          // was likely 2
borderColor: theme.colors.borderMuted,
borderRadius: theme.radius.lg, // 16
backgroundColor: theme.colors.surface,
```

**Step 4: Refine chat bubble styling**

Update chat bubble backgrounds to use translucent surfaces:

```typescript
// Admin bubble (left):
backgroundColor: theme.colors.surfaceMuted,
borderColor: theme.colors.borderMuted,
borderWidth: 1,
borderRadius: theme.radius.lg,

// Donor bubble (right):
backgroundColor: theme.colors.accent + '18',
borderColor: theme.colors.accent + '30',
borderWidth: 1,
borderRadius: theme.radius.lg,
```

**Step 5: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

**Step 6: Commit**

```bash
git add screens/MessagesScreen.tsx
git commit -m "feat: messages polish — donation context card, refined bubbles and thread list"
```

---

## Task 7: Navigation + Final Motion Pass

Resize tab bar, replace DONATE circle with accent pill, refine active indicator. Final animation audit.

**Files:**
- Modify: `navigation/AppNavigator.tsx`
- Modify: `screens/HowItWorksCarousel.tsx`
- Reference: `docs/design/brand-guide.md` (animation specs)

**Step 1: Replace DONATE circle button**

In `AppNavigator.tsx`, replace the `centerButton` style and rendering:

```typescript
// Replace centerButton style:
centerButton: {
  paddingHorizontal: 20,
  height: 40,
  borderRadius: 20,       // pill shape
  borderWidth: 1.5,       // was 3
  alignItems: 'center',
  justifyContent: 'center',
  // Remove: width: 132, height: 132, borderRadius: 66, marginTop: -62
},
centerText: {
  color: '#F3EFFF',
  fontSize: 12,            // was 19
  fontWeight: '700',
  letterSpacing: 1.2,      // was 1.5
},
```

**Step 2: Resize tab bar**

```typescript
wrap: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 64,              // was 84
  paddingHorizontal: 24,   // was 18
  paddingBottom: 8,        // was 10
  marginBottom: 12,        // was 18
  position: 'relative',
  overflow: 'visible',
},
```

Remove `topFill` and `topRail` elements and their styles — they were part of the brutalist thick border aesthetic.

**Step 3: Replace active indicator**

Replace `sideActiveIndicator` with a dot:

```typescript
sideActiveIndicator: {
  width: 4,                // was 18
  height: 4,               // was 3
  borderRadius: 2,         // circular dot
  marginTop: 2,            // was -3
},
```

Change indicator color from `theme.colors.accent` to `theme.colors.teal`:

```typescript
backgroundColor: theme.colors.teal, // was theme.colors.accent
```

**Step 4: Update tab bar surface**

Use glass surface for the tab bar:

```typescript
backgroundColor: theme.colors.surface, // keep
borderTopWidth: 1,
borderTopColor: theme.colors.borderMuted,
```

Remove the `topFill` and `topRail` View elements from the JSX.

**Step 5: Update `?` help button**

```typescript
topHelpButton: {
  // ...existing position
  width: 32,               // was 36
  height: 32,              // was 36
  borderRadius: 16,        // was 18
  borderWidth: 1,          // was 2
},
topHelpText: {
  fontSize: 18,            // was 22
  lineHeight: 20,          // was 24
},
```

**Step 6: Refine HowItWorksCarousel**

In `screens/HowItWorksCarousel.tsx`, update the sheet styling:

```typescript
sheet: {
  // ...existing
  borderRadius: 18,        // keep — matches theme.radius.xl
  borderWidth: 1,          // was 1, keep
  // Add glass surface:
  // backgroundColor already uses theme.colors.surface
},
```

Update headline to use display font:

```typescript
// In content, headline text:
fontFamily: theme.typography.display, // add this
fontWeight: '300',                     // add this — was '600'
```

Update primary button border:

```typescript
primaryButton: {
  borderWidth: 1.5,        // was 2
  borderRadius: 10,        // was 11
  minHeight: 44,           // was 46
},
```

Update nav buttons:

```typescript
navButton: {
  flex: 1,
  minHeight: 34,           // was 36
  borderWidth: 1,          // keep
  borderRadius: 8,         // was 9
},
```

**Step 7: Run quality gate**

```bash
npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false
```

**Step 8: Bundle check**

```bash
CI=true npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/glimpse.bundle
```

**Step 9: Device performance check**

```bash
cd android && ./gradlew assembleRelease
# Install on Seeker device
# Verify 60fps during: tab switches, card scroll, give flow transitions, home breathing animation
# If any jank on a specific animation: remove that animation, keep the rest
```

**Step 10: Commit**

```bash
git add navigation/AppNavigator.tsx screens/HowItWorksCarousel.tsx
git commit -m "feat: navigation polish — accent pill tab, teal dot indicator, carousel refinement"
```

---

## Post-Implementation Checklist

After all 7 tasks:

- [ ] All quality gates pass (lint, typecheck, tests, bundle)
- [ ] On-device: home → feed → give → confirm → receipt → messages flow works end-to-end
- [ ] Proof Card verified state shows teal accent correctly
- [ ] Proof Card unavailable state degrades gracefully (no accent, no badge)
- [ ] Tab bar renders at proper size (no 132px circle)
- [ ] Cormorant Garamond renders correctly on device (amounts, headlines)
- [ ] No regressions: wallet connect, USDC donation, message send all work
- [ ] `config/env.ts` unchanged (mainnet constants)
- [ ] `services/donations.ts` unchanged (transaction pipeline)
- [ ] No new npm dependencies added
