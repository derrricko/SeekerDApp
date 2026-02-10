# Glimpse — Solana Mobile DApp

## App Architecture

### Navigation Flow
```
Welcome Screen → Onboarding Carousel (swipeable, 4 slides) → Home Screen
                                                               ├── Give tab (default)
                                                               ├── Glimpses tab (coming soon)
                                                               └── Profile tab
```

### Screen Breakdown
- **WelcomeScreen** — Animated brand reveal (GLIMPSE + tagline + Creation of Adam artwork), tap to continue
- **OnboardingScreen** — 4-slide horizontal carousel with skip button, animated dot pagination, staggered slide entrances
- **HomeScreen** — Main app with bottom tab navigation:
  - **Give tab**: Hero area, custom giving card (direction + amount), BeHeard tier card, "Something bigger?" CTA
  - **Glimpses tab**: Coming soon placeholder
  - **Profile tab**: Wallet status, theme toggle, FAQ, links, version

### Key Files
```
App.tsx                              — Root navigation (Welcome → Onboarding → Home)
screens/WelcomeScreen.tsx            — Brand intro with art + animations
screens/OnboardingScreen.tsx         — Swipeable onboarding carousel
screens/HomeScreen.tsx               — Main screen with 3 tabs + USDC transfer flow
data/content.ts                      — Shared content constants (FAQ, tiers, directions, slides)
utils/transfer.ts                    — USDC SPL token transfer via MWA
components/GlassCard.tsx             — Reusable glassmorphic card component
components/theme/ThemeColors.ts      — Light/dark color palettes
components/theme/ThemeContext.tsx     — Theme provider + useTheme hook
components/theme/typography.ts       — Typography scale system
components/theme/index.ts            — Theme barrel exports
components/providers/                — Solana wallet + connection providers
```

## UI Design System — Glassmorphism

### Design Principles
- **Borders**: Subtle 1px rgba borders with transparency (0.5px for subtle variants)
- **Shadows**: Soft shadows with blur (shadowRadius: 12-24px), themed shadow colors
- **Rounded Corners**: 16px border radius for cards, 14px for buttons, 24px for art frames
- **Blur Effects**: `@react-native-community/blur` BlurView on BOTH iOS and Android (blurAmount: 12)
- **Colors**: Warm terracotta palette with light/dark support
- **Typography**: Georgia/serif for brand + display, system font for body
- **Interactive states**: Scale 0.97-0.98 on press with spring bounce-back + haptic feedback
- **Whitespace**: Generous padding (24-32px between sections)
- **Animations**: Proper easing curves, 300ms entrances, 50ms stagger

### Color Palette
```typescript
// Light Mode (warm tones)
background: '#F7F1E9'
backgroundSecondary: '#EFE3D5'
glass: 'rgba(255, 255, 255, 0.7)'
glassBorder: 'rgba(72, 51, 38, 0.12)'
primary: '#D07A4F'       // Terracotta
primaryLight: 'rgba(208, 122, 79, 0.18)'
accent: '#355C5A'        // Deep teal
secondary: '#2F7B6D'     // Green
textPrimary: '#2A1C12'
textSecondary: '#5C4B40'
textTertiary: '#8B776B'

// Dark Mode
background: '#14110E'
backgroundSecondary: '#201A16'
glass: 'rgba(32, 26, 22, 0.7)'
glassBorder: 'rgba(255, 255, 255, 0.12)'
primary: '#E29A73'       // Light terracotta
accent: '#89C2B5'        // Light teal
secondary: '#79B19F'     // Light green
textPrimary: '#F8F2EA'
textSecondary: '#C7B8AA'
textTertiary: '#9A887A'
```

### Typography Scale
```typescript
import { Typography } from './components/theme';

// 10 styles available:
Typography.display     // 44px, weight 200, Georgia — hero titles
Typography.heading     // 32px, weight 200 — section titles
Typography.subheading  // 22px, weight 300 — card titles
Typography.body        // 17px, weight 400 — content text
Typography.bodySmall   // 14px, weight 400 — secondary text
Typography.caption     // 12px, weight 400 — metadata
Typography.brand       // 24px, weight 500, Georgia — "Glimpse" header
Typography.buttonLarge // 17px, weight 600 — primary buttons
Typography.buttonSmall // 14px, weight 600 — secondary buttons
Typography.label       // 14px, weight 500 — form/nav labels
```

Brand font: `Georgia` (iOS) / `serif` (Android) for display and brand text only.

### GlassCard Component
```typescript
import GlassCard from './components/GlassCard';

// Three variants for visual hierarchy:
<GlassCard variant="primary">   // Terracotta-tinted glass, 24px padding
<GlassCard variant="secondary"> // Default glass, 20px padding (default)
<GlassCard variant="subtle">    // Thinner border, lighter shadow

// Pressable with haptics:
<GlassCard variant="primary" onPress={handlePress}>
  <Text>Tappable card with spring animation + haptic feedback</Text>
</GlassCard>
```

### Theme Usage
```typescript
import { useTheme, Typography } from './components/theme';

function MyComponent() {
  const { colors, isDark, mode, toggleMode } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <GlassCard>
        <Text style={[Typography.body, { color: colors.textPrimary }]}>
          Content
        </Text>
      </GlassCard>
    </View>
  );
}
```

### Animation Guidelines
```typescript
// Easing curves (MUST use — no linear motion)
import { Easing } from 'react-native';
const EASE_OUT = Easing.out(Easing.cubic);  // Entrances — arrive fast, settle
const EASE_IN = Easing.in(Easing.cubic);    // Exits — build momentum, depart

// Entrance animations
const ENTRANCE_DURATION = 300;  // ms — max for user-initiated
const ENTRANCE_STAGGER = 50;    // ms per item — max 50ms

// Spring config for press interactions
const springConfig = { useNativeDriver: true, speed: 50, bounciness: 4 };

// Press scale range: 0.97–0.98 (subtle deformation)
// Always use useNativeDriver: true for transform/opacity
// Use LayoutAnimation for height/layout changes (not Animated)
// Stop looping animations on unmount (cleanup in useEffect)
```

### Haptic Feedback
```typescript
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Use on ALL interactive elements:
ReactNativeHapticFeedback.trigger('impactLight');  // Buttons, card taps, tab switches
```

## Project Stack
- Frontend: React Native 0.71.4 + TypeScript
- Target Device: Solana Seeker (Android)
- Wallet: Mobile Wallet Adapter (MWA) 2.0
- Tokens: @solana/spl-token (USDC transfers)
- Chain: Solana devnet

## USDC Transfer Flow
1. User taps "Give Now" on the giving card
2. Confirmation modal shows amount + direction
3. If wallet not connected → MWA authorize prompt
4. Build USDC transfer transaction (sender ATA → recipient ATA)
5. Sign + send via MWA `signAndSendTransactions`
6. Confirm on-chain, show success/error state

```typescript
import { transferUSDC, RECIPIENT_WALLET } from './utils/transfer';
```

## Key Packages
```bash
yarn add @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana-mobile/mobile-wallet-adapter-protocol @solana/web3.js @solana/spl-token @react-native-community/blur react-native-haptic-feedback react-native-safe-area-context
```

## Mobile Wallet Adapter Pattern
```typescript
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

const APP_IDENTITY = {
  name: 'Glimpse',
  uri: 'https://glimpse.give',
  icon: 'favicon.ico',
};
```

## Security Requirements
- Always validate signers in Anchor: `pub authority: Signer<'info>`
- Use checked math: `amount.checked_add(fee).ok_or(ErrorCode::Overflow)?`
- Validate account ownership
- Use PDAs with proper seeds

## Testing
- Emulator: Android Studio AVD
- Device: Enable USB debugging on Seeker, run `adb devices`
- Mock Wallet: For testing MWA without real funds
- Verify no import errors: `npx react-native start`
- Build Android: `npx react-native run-android`
