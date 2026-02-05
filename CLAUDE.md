# Solana Mobile Development Guide

## UI Design System — iOS 18 Glassmorphism
All UI/visual design follows iOS 18-style glassmorphism with dark/light mode support:
- **Borders**: Subtle 1px rgba borders with transparency
- **Shadows**: Soft shadows with blur (shadowRadius: 16-24px)
- **Rounded Corners**: 12-20px border radius
- **Blur Effects**: @react-native-community/blur for frosted glass
- **Colors**: Cool-toned palette (blues, teals, purples)
- **Typography**: System font, title case, light/medium weights
- **Interactive states**: Scale animation (0.98) on press

### Color Palette
```typescript
// Light Mode
background: '#F0F4F8'
glass: 'rgba(255, 255, 255, 0.65)'
primary: '#007AFF' // iOS blue
accent: '#5856D6'  // Purple
secondary: '#32D4DE' // Teal

// Dark Mode
background: '#0A1628'
glass: 'rgba(30, 41, 59, 0.65)'
primary: '#0A84FF'
accent: '#BF5AF2'
secondary: '#40E0D0'
```

### Theme Usage
```typescript
import { useTheme } from './components/theme';

function MyComponent() {
  const { colors, isDark, mode, toggleMode } = useTheme();

  return (
    <View style={{ backgroundColor: colors.background }}>
      <GlassCard>
        <Text style={{ color: colors.textPrimary }}>Content</Text>
      </GlassCard>
      <GlassButton title="Action" onPress={handlePress} />
    </View>
  );
}
```

### Glass Card Pattern
```typescript
import { BlurView } from '@react-native-community/blur';

const GlassCard = ({ children }) => (
  <View style={{
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  }}>
    {Platform.OS === 'ios' && (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={20}
      />
    )}
    <View style={{ backgroundColor: colors.glass, padding: 20 }}>
      {children}
    </View>
  </View>
);
```

## Project Stack
- Frontend: React Native + TypeScript
- Wallet: Mobile Wallet Adapter (MWA) 2.0
- Smart Contracts: Rust + Anchor Framework
- Tokens: @solana/spl-token
- NFTs: Metaplex Umi

## Key Packages
```bash
yarn add @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana-mobile/mobile-wallet-adapter-protocol @solana/web3.js @solana/spl-token @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata @react-native-community/blur
```

## Mobile Wallet Adapter Pattern
```typescript
import { transact, Web3MobileWallet } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';

const APP_IDENTITY = {
  name: 'SeekerDApp',
  uri: 'https://mydapp.com',
  icon: './assets/icon.png',
};

// Connect wallet
const connect = async () => {
  const authResult = await transact(async (wallet: Web3MobileWallet) => {
    return await wallet.authorize({
      chain: 'solana:devnet',
      identity: APP_IDENTITY,
    });
  });
  return authResult;
};
```

## Security Requirements
- Always validate signers in Anchor: `pub authority: Signer<'info>`
- Use checked math: `amount.checked_add(fee).ok_or(ErrorCode::Overflow)?`
- Validate account ownership
- Use PDAs with proper seeds
- Run `cargo clippy` and `cargo audit` before deployment

## GitHub Repos
- SDK: https://github.com/solana-mobile/solana-mobile-stack-sdk
- MWA: https://github.com/solana-mobile/mobile-wallet-adapter
- Anchor: https://github.com/solana-foundation/anchor
- Metaplex: https://github.com/metaplex-foundation/umi

## Testing
- Emulator: Android Studio AVD
- Device: Enable USB debugging on Seeker, run `adb devices`
- Mock Wallet: For testing MWA without real funds
- After iOS pod install: `cd ios && pod install`
