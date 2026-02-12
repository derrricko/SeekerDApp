# Glimpse

A Solana Mobile giving dApp built for the Seeker device. Users donate USDC to real-world needs through an escrow program, with full on-chain transparency.

## Architecture

- **Frontend**: React Native 0.76 + TypeScript (Android-only, targeting Solana Seeker)
- **Wallet**: Mobile Wallet Adapter (MWA) 2.0
- **On-chain**: Anchor 0.30.1 escrow program on Solana devnet
- **Backend**: Supabase (PostgreSQL + Edge Functions for auth and transaction recording)
- **Token**: USDC (SPL) on devnet

See [CLAUDE.md](./CLAUDE.md) for the full architecture reference, design system, security model, and build troubleshooting.

## Quick Start

### Prerequisites

- Node.js 18+
- Android Studio with an AVD (Pixel 6, API 35) or a Solana Seeker device
- An MWA-compatible wallet app installed on the device/emulator
- Rust + Solana CLI (only needed for escrow program development)

### Setup

```bash
npm install
npx react-native start
```

### Run on Android

```bash
npx react-native run-android
```

### Bundle Check

```bash
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

## Project Structure

```
screens/                  App screens (Welcome, Onboarding, Home)
components/               GlassCard, theme system, providers
utils/                    USDC transfer, escrow instruction builder, error handling
config/                   Environment config (program IDs, mints, Supabase creds)
data/                     Shared content constants (FAQ, tiers, slides)
programs/glimpse-escrow/  Anchor escrow program (Rust)
supabase/migrations/      Database schema (001-005)
supabase/functions/       Edge functions (nonce, siws-verify, record-transaction)
scripts/                  One-time setup scripts (vault initialization)
docs/                     Archived reference files
```

## Environment

The app uses hardcoded devnet configuration in `config/env.ts`:

| Variable | Location | Purpose |
|----------|----------|---------|
| `SOLANA_CLUSTER` | `config/env.ts` | `devnet` |
| `USDC_MINT` | `config/env.ts` | Devnet USDC mint address |
| `ESCROW_PROGRAM_ID` | `config/env.ts` | Deployed escrow program |
| `SUPABASE_URL` | `config/env.ts` | Supabase project URL |
| `SUPABASE_ANON_KEY` | `config/env.ts` | Supabase publishable key |

Edge functions read `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SOLANA_RPC_URL` from Deno environment variables.

## Testing

### App Tests

```bash
npm test -- --watchAll=false
```

### Escrow Program Tests (LiteSVM)

Requires `protoc` (`brew install protobuf`) and a built `.so`:

```bash
cargo-build-sbf --manifest-path programs/glimpse-escrow/Cargo.toml --sbf-out-dir target/deploy
cargo test --manifest-path programs/glimpse-escrow/Cargo.toml --test escrow_test
```

9 integration tests covering `initialize_need`, `donate`, and `disburse` instructions.

### Lint

```bash
npm run lint
```

## Devnet Deployment

### Escrow Program

- **Program ID**: `7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE`
- **Admin Wallet**: `HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5`

### Vault PDAs

| Slug | Target |
|------|--------|
| shower | $25 |
| groceries | $100 |
| wardrobe | $250 |
| tires | $400 |
| rent | $1,000 |

### Known Limitations

- Devnet only (not deployed to mainnet)
- Supabase migrations exist locally but are not yet pushed
- Edge functions exist locally but are not yet deployed
- New Architecture is disabled (`newArchEnabled=false`) for MWA compatibility
