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
utils/transfer.ts                    — USDC SPL token transfer via MWA (routes through escrow when slug provided)
utils/escrow.ts                      — Manual Anchor instruction builder (web3.js + borsh)
utils/errors.ts                      — MWA + transaction error handling (handleMWAError, safeTransaction)
config/env.ts                        — Program IDs, USDC mint, Supabase creds, RPC URL
globals.js                           — Solana polyfills (Buffer, process, btoa/atob) — MUST be first import
metro.config.js                      — Metro bundler config with Node.js module resolution for Solana
components/GlassCard.tsx             — Reusable glassmorphic card component
components/theme/ThemeColors.ts      — Light/dark color palettes
components/theme/ThemeContext.tsx     — Theme provider + useTheme hook
components/theme/typography.ts       — Typography scale system
components/theme/index.ts            — Theme barrel exports
components/providers/                — Solana wallet + connection providers
components/providers/AuthProvider.tsx — SIWS auth flow (activates when SUPABASE_URL is set)
scripts/init-vaults.ts               — One-time script to initialize NeedVault PDAs on devnet
programs/glimpse-escrow/             — Anchor escrow program (Rust)
programs/glimpse-escrow/src/constants.rs — Hardcoded USDC_MINT + ADMIN_PUBKEY
programs/glimpse-escrow/tests/escrow_test.rs — LiteSVM integration tests (9 tests)
supabase/migrations/                 — Database schema migrations (001-004)
supabase/functions/                  — Edge functions (nonce, siws-verify)
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
- Frontend: React Native 0.76.5 + TypeScript ~5.3
- Target Device: Solana Seeker (Android)
- Wallet: Mobile Wallet Adapter (MWA) 2.0
- Tokens: @solana/spl-token (USDC transfers)
- Chain: Solana devnet
- Escrow Program: Anchor 0.30.1 (Rust), deployed to devnet
- Backend: Supabase (PostgreSQL + Edge Functions)
- Solana SDK: @solana/web3.js v1 (NOT @solana/kit — Anchor + MWA require v1)
- Instruction Building: Manual with web3.js + @coral-xyz/borsh (NOT @coral-xyz/anchor client)

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

### On-Chain Constraints (Enforced in Rust)
- **USDC mint pinned**: All instructions validate `address = USDC_MINT` against the hardcoded devnet address in `constants.rs`. Prevents fake-mint attacks.
- **Admin-only initialization**: `initialize_need` requires `authority.key() == ADMIN_PUBKEY`. Prevents unauthorized vault creation.
- **Slug validation**: `require!(!slug.is_empty() && slug.len() <= 32)` in `initialize_need` handler.
- **Signer validation**: All mutating instructions use `Signer<'info>` for authority/donor.
- **Checked math**: `vault.funded.checked_add(amount).ok_or(GlimpseError::Overflow)?`
- **PDA seeds**: `[b"need", slug.as_bytes()]` with stored bump for deterministic derivation.
- **has_one constraints**: `disburse` validates `vault.authority` and `vault.disburse_to`.
- **Disbursement guard**: Both `donate` and `disburse` check `!vault.disbursed`.

### Key Constants (`programs/glimpse-escrow/src/constants.rs`)
```rust
pub const USDC_MINT: Pubkey = pubkey!("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
pub const ADMIN_PUBKEY: Pubkey = pubkey!("HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5");
```
These are imported by all three instructions. If the admin wallet or USDC mint changes, update this single file.

### Error Codes (`programs/glimpse-escrow/src/error.rs`)
| Code | Name | Description |
|------|------|-------------|
| 6000 | Overflow | Checked math overflow |
| 6001 | AlreadyDisbursed | Vault already paid out |
| 6002 | ZeroAmount | Donation amount is 0 |
| 6003 | Unauthorized | Signer != authority or admin |
| 6004 | InvalidMint | USDC mint address mismatch |
| 6005 | InvalidSlug | Slug empty or > 32 bytes |

These are mapped to user-friendly messages in `utils/errors.ts` (`ANCHOR_ERROR_MAP`).

### General Patterns
- Always validate signers in Anchor: `pub authority: Signer<'info>`
- Use checked math: `amount.checked_add(fee).ok_or(ErrorCode::Overflow)?`
- Validate account ownership via `has_one` or `constraint =`
- Use PDAs with proper seeds and stored bumps

## Testing

### App Testing
- Emulator: Android Studio AVD (Pixel_6 API 35)
- Device: Enable USB debugging on Seeker, run `adb devices`
- Mock Wallet: For testing MWA without real funds
- Verify no import errors: `npx react-native start`
- Build Android: `npx react-native run-android`
- Bundle check: `npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle`

### Escrow Program Tests (LiteSVM)
Run the 9-test integration suite:
```bash
cargo test --manifest-path programs/glimpse-escrow/Cargo.toml --test escrow_test
```

**Test coverage:**
| Test | Instruction | Validates |
|------|-------------|-----------|
| test_initialize_need | initialize_need | Happy path: vault state, ATA creation, bump |
| test_initialize_need_duplicate | initialize_need | PDA collision rejected |
| test_initialize_need_non_admin | initialize_need | Non-admin signer rejected |
| test_donate_happy_path | donate | Token transfer, funded counter update |
| test_donate_zero_amount | donate | Zero amount rejected |
| test_donate_after_disburse | donate | Post-disburse donation rejected |
| test_disburse_happy_path | disburse | Full flow: donate → disburse → verify balances |
| test_disburse_unauthorized | disburse | Imposter signer rejected |
| test_disburse_double | disburse | Double-disburse rejected |

**Test architecture:**
- Uses `litesvm = "0.2"` (MUST use 0.2, not 0.3+ — solana-sdk 2.0 is incompatible with Anchor 0.30.1's solana-program 1.18)
- `with_sigverify(false)` allows signing as `ADMIN_PUBKEY` without its private key
- `inject_mint()` places a pre-built SPL Mint account at the hardcoded USDC address
- `send_admin_tx()` uses an `AtomicU64` counter for unique signatures (avoids LiteSVM `AlreadyProcessed` dedup)
- Loads `.so` from `target/deploy/glimpse_escrow.so` — must run `cargo-build-sbf` first

**Dev dependencies** (in `programs/glimpse-escrow/Cargo.toml`):
```toml
[dev-dependencies]
litesvm = "0.2"
solana-sdk = "1.18"
solana-program = "1.18"
spl-token = { version = "4", features = ["no-entrypoint"] }
spl-associated-token-account = { version = "3", features = ["no-entrypoint"] }
borsh = "0.10"
sha2 = "0.10"
```

**protoc required**: LiteSVM pulls solana-svm which needs the protobuf compiler. Install with `brew install protobuf`.

## Deployed Infrastructure

### Escrow Program (Devnet)
- **Program ID**: `7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE`
- **IDL Account**: `2rHk3znuneK3o6mCD8N7P8QnepWM2BnDj5vmB1PYNsVH`
- **Deployer Wallet**: `HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5`

### Vault PDAs (Devnet)
Seeds: `["need", slug_bytes]` under the escrow program
| Slug | PDA | Target (USDC) |
|------|-----|---------------|
| shower | `5Qnw3W3MbF6oNmPhN5Nfh93g51hKppFtH5y6TkZPMEsM` | $25 |
| groceries | `CnxrG6ScusNpSFVyy4Ti34ZE5bjYhRVVWHTN73859S5c` | $100 |
| wardrobe | `EW82JfL5rZxEsjuL3pJovyugYbtF1PPhEL7ejZQ6MmKa` | $250 |
| tires | `HjfPfQvx1wy5BRKDZxrFCKde3KY74pJypyNQQuxASEVf` | $400 |
| rent | `EMmuGFWUJbpjopt2DqZAyQLnSnEKK4dVLqbpy9shr26k` | $1000 |

### Supabase
- **Project URL**: `https://knvagydrbbvuumabmxcg.supabase.co`
- Database migrations exist in `supabase/migrations/` (001-004) — NOT YET PUSHED
- Edge functions exist in `supabase/functions/` (nonce, siws-verify) — NOT YET DEPLOYED

## Escrow Instruction Building (IMPORTANT)

**Do NOT use `@coral-xyz/anchor` TypeScript client.** It has polyfill issues in React Native and the 0.30.1 IDL format is incompatible with the RN-safe 0.28.0 client.

Build instructions manually with `@solana/web3.js` v1 + `@coral-xyz/borsh`:
```typescript
// Key files:
// utils/escrow.ts     — buildDonateTransaction(), deriveVaultPDA()
// utils/transfer.ts   — transferUSDC() routes through escrow when slug provided
// utils/errors.ts     — handleMWAError(), handleTransactionError(), safeTransaction()
// config/env.ts       — ESCROW_PROGRAM_ID, USDC_MINT, SUPABASE_URL, SUPABASE_ANON_KEY
```

**Discriminator values** (verified against IDL — MUST match exactly):
```typescript
// donate instruction: sha256("global:donate")[0..8]
const DONATE_DISCRIMINATOR = Buffer.from([121, 186, 218, 211, 73, 70, 196, 180]);

// initialize_need instruction: sha256("global:initialize_need")[0..8]
const INIT_NEED_DISCRIMINATOR = Buffer.from([16, 89, 102, 70, 140, 101, 220, 41]);

// disburse instruction: sha256("global:disburse")[0..8]
const DISBURSE_DISCRIMINATOR = Buffer.from([68, 250, 205, 89, 217, 142, 13, 44]);
```

**Account order in instruction keys MUST match Rust struct field order exactly.**
Verify against `programs/glimpse-escrow/src/instructions/donate.rs`.

---

## Known Issues & Solutions (Build Reference)

### React Native 0.76 Android Build System

**Plugin loading**: RN 0.76 uses composite builds via `settings.gradle`. Plugins MUST use the `plugins {}` DSL block, NOT `apply plugin:` syntax.
```gradle
// CORRECT (RN 0.76):
plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.facebook.react")
}

// WRONG (will fail with "Plugin not found"):
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"
```

**Autolinking**: Two calls are required for autolinking to work:
1. `settings.gradle`: `extensions.configure(com.facebook.react.ReactSettingsExtension){ ex -> ex.autolinkLibrariesFromCommand() }`
2. `android/app/build.gradle`: `autolinkLibrariesWithApp()` inside the `react {}` block
Missing either one causes "Could not find project" errors for native modules.

**Do NOT add `com.facebook.react:react-native-gradle-plugin` to buildscript classpath.** RN 0.76 loads it via the composite build in settings.gradle. Adding it to classpath causes "Could not find" resolution errors.

**`ext {}` must be inside `buildscript {}`**: The `plugins {}` block executes before top-level `ext {}`. Properties like `ndkVersion`, `compileSdkVersion` must be defined in `buildscript { ext { ... } }` so they're available when plugins evaluate.

**Plugin repositories**: `pluginManagement` in `settings.gradle` MUST include `google()`, `mavenCentral()`, and `gradlePluginPortal()` repositories, or AGP/React Native plugins fail to resolve.

**JVM heap**: RN 0.76 builds require at least 4GB. Set in `gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

**Keep `newArchEnabled=false`**: Solana MWA libraries may not fully support the New Architecture.

### Anchor Program Build (Rust/Solana)

**Cargo.lock version format**: System Rust 1.93+ generates Cargo.lock v4, which is incompatible with Solana platform-tools (older Rust). Fix:
```bash
cargo +solana generate-lockfile
```
This generates a v3 format lockfile. **Always use this after modifying Cargo.toml.**

**Crate MSRV pinning**: Solana platform-tools bundles an older Rust (1.75-1.79). Many crates publish versions requiring newer Rust. Pin these:
```bash
cargo +solana update -p blake3 --precise 1.5.5          # blake3 1.8+ needs edition2024 (Rust 1.85+)
cargo +solana update -p borsh --precise 1.5.3            # borsh 1.6+ needs Rust 1.77+
cargo +solana update -p proc-macro-crate --precise 3.1.0 # 3.4+ pulls toml_edit needing Rust 1.82+
cargo +solana update -p indexmap --precise 2.7.1          # 2.13+ needs Rust 1.82+
```
**Run these after every `cargo +solana generate-lockfile`** as the lockfile regeneration resets pins.

**`idl-build` feature required**: Anchor CLI 0.32.1 requires an `idl-build` feature in the program's `Cargo.toml`:
```toml
[features]
default = []
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]
```

**SBF binary not generated by `anchor build`**: If `anchor build` produces the IDL but no `.so` file, run the BPF compiler directly:
```bash
cargo-build-sbf --manifest-path programs/glimpse-escrow/Cargo.toml --sbf-out-dir target/deploy
```

**Solana CLI installation**: The Homebrew install (`solana-cli`) lacks `cargo-build-sbf`. Use the official installer:
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.7/install)"
```
Ensure `~/.local/share/solana/install/active_release/bin` is in PATH.

**Discriminator verification**: After every `anchor build`, verify discriminator bytes in `target/idl/glimpse_escrow.json` match the hardcoded values in `utils/escrow.ts`. A mismatch causes silent transaction failures (program rejects the instruction).

### Polyfill Setup (Solana in React Native)

**Import order is critical** in `index.js`:
1. `./globals` (Buffer, process, location, btoa, atob)
2. `react-native-get-random-values` (crypto.getRandomValues)
3. App imports

**RN 0.76 Hermes has native TextEncoder/TextDecoder** — do NOT polyfill them (remove `text-encoding` package).

**Metro resolver** must map Node.js built-ins in `metro.config.js`:
```js
extraNodeModules: {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('readable-stream'),
  buffer: require.resolve('buffer'),
  // ... plus empty-module for: assert, http, https, os, url, zlib, path, fs, net, tls
}
```

### Common Runtime Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ERROR_AUTHORIZATION_FAILED` from MWA | Cached auth token expired/revoked | Clear cached tokens, re-prompt wallet authorization |
| Transaction simulation failed | Wrong discriminator bytes | Verify against IDL (`target/idl/glimpse_escrow.json`) |
| `Cannot read property 'getRandomValues'` | Missing crypto polyfill | Ensure `react-native-get-random-values` is imported before any Solana import |
| `Buffer is not defined` | globals.js not loaded first | Ensure `import './globals'` is the first import in `index.js` |
| `Plugin with id 'com.facebook.react' not found` | Using `apply plugin:` instead of `plugins {}` DSL | Switch to `plugins { id("com.facebook.react") }` |
| Autolinked native module not found | Missing `autolinkLibrariesWithApp()` | Add to `react {}` block in `android/app/build.gradle` |
