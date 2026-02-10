# Solana Mobile Development Guide

## App Architecture

### Navigation Flow
```
Welcome Screen → Onboarding Carousel (swipeable, 4 slides) → Home Screen
                                                               ├── Give tab (default)
                                                               ├── Glimpses tab (coming soon)
                                                               └── Profile tab
```

### Screen Breakdown
- **WelcomeScreen** — Animated brand reveal (GLIMPSE + tagline), tap to continue
- **OnboardingScreen** — 4-slide horizontal carousel with skip button, dot pagination
- **HomeScreen** — Main app with bottom tab navigation:
  - **Give tab**: Hero area, custom giving card (direction + amount), BeHeard tier card, "Something bigger?" CTA
  - **Glimpses tab**: Coming soon placeholder
  - **Profile tab**: Wallet status, theme toggle, FAQ, links, version

### Key Files
```
App.tsx                           — Root navigation (Welcome → Onboarding → Home)
screens/WelcomeScreen.tsx         — Brand intro
screens/OnboardingScreen.tsx      — Swipeable onboarding carousel
screens/HomeScreen.tsx            — Main screen with 3 tabs + USDC transfer flow
data/content.ts                   — Shared content constants (FAQ, tiers, directions, slides)
utils/transfer.ts                 — USDC SPL token transfer via MWA
components/theme/                 — Theme system (light/dark/system)
components/providers/             — Solana wallet + connection providers
```

## UI Design System — iOS 18 Glassmorphism
All UI/visual design follows iOS 18-style glassmorphism with dark/light mode support:
- **Borders**: Subtle 1px rgba borders with transparency
- **Shadows**: Soft shadows with blur (shadowRadius: 16-24px)
- **Rounded Corners**: 12-20px border radius
- **Blur Effects**: @react-native-community/blur for frosted glass
- **Colors**: Cool-toned palette (blues, teals, purples)
- **Typography**: System font, light weights for headings (200-300), medium for body
- **Interactive states**: Scale animation (0.98) on press with spring bounce-back
- **Whitespace**: Generous padding (24-32px between sections)
- **Animations**: Spring-based with consistent timing (friction: 8-10, tension: 40)

### Color Palette
```typescript
// Light Mode
background: '#F0F4F8'
glass: 'rgba(255, 255, 255, 0.65)'
primary: '#5856D6'  // Purple
secondary: '#32D4DE' // Teal

// Dark Mode
background: '#0A1628'
glass: 'rgba(30, 41, 59, 0.65)'
primary: '#BF5AF2'  // Bright purple
secondary: '#40E0D0' // Bright teal
```

### Theme Usage
```typescript
import { useTheme } from './components/theme';

function MyComponent() {
  const { colors, isDark, mode, toggleMode } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.textPrimary }}>Content</Text>
    </View>
  );
}
```

## Project Stack
- Frontend: React Native 0.71.4 + TypeScript
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
yarn add @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana-mobile/mobile-wallet-adapter-protocol @solana/web3.js @solana/spl-token @react-native-community/blur
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
- After iOS pod install: `cd ios && pod install`
- Verify no import errors: `npx react-native start`
- Build Android: `npx react-native run-android`
