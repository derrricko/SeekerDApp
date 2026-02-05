# Solana Mobile Development Guide

## UI Design System — Neo Brutalist
All UI/visual design must follow neo brutalist principles:
- **Borders**: Solid black borders (2-4px), no rounded corners or minimal rounding
- **Shadows**: Hard offset shadows (no blur), typically 4-8px offset in black
- **Buttons**: Chunky, oversized, high-contrast with bold text
- **Colors**: High contrast palette, primary colors, black/white base
- **Typography**: Bold, sans-serif, often uppercase for headers
- **No gradients, no blur, no soft shadows**
- **Interactive states**: Shift shadow on press (shadow reduces/removes on tap)

```typescript
// Example Neo Brutalist button style
const brutalistButton = {
  backgroundColor: '#FFFF00', // Bold primary color
  borderWidth: 3,
  borderColor: '#000000',
  shadowColor: '#000000',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0, // NO blur
  elevation: 0,
  paddingVertical: 16,
  paddingHorizontal: 24,
};

const brutalistButtonPressed = {
  ...brutalistButton,
  shadowOffset: { width: 1, height: 1 }, // Reduced shadow on press
  transform: [{ translateX: 3 }, { translateY: 3 }],
};
```

## Project Stack
- Frontend: React Native + TypeScript
- Wallet: Mobile Wallet Adapter (MWA) 2.0
- Smart Contracts: Rust + Anchor Framework
- Tokens: @solana/spl-token
- NFTs: Metaplex Umi

## Key Packages
```bash
yarn add @solana-mobile/mobile-wallet-adapter-protocol-web3js @solana-mobile/mobile-wallet-adapter-protocol @solana/web3.js @solana/spl-token @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/mpl-token-metadata
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
