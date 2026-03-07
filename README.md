# Glimpse

**Give. See the proof. Start a conversation.**

Glimpse is a USDC donation app built for the [Solana Seeker](https://solanamobile.com/seeker) mobile device. Every donation is recorded on-chain with a Memo receipt, verified server-side, and opens a direct message thread between donor and recipient. Zero fees to donors.

Built for the [Monolith 2026 Hackathon](https://www.solanamobile.com/monolith) by a solo founder.

## How It Works

1. Connect your wallet via Mobile Wallet Adapter (MWA)
2. Choose a cause you care about
3. Donate USDC — transaction includes an on-chain Memo receipt
4. Server validates the transaction (mint, authority, destination, memo)
5. A message thread opens between you and the recipient

Every dollar is tracked. Every impact is proven.

## Live on Mainnet

- North Star path working end-to-end since March 2, 2026
- Submitted to the [Solana dApp Store](https://github.com/nicola-solana-labs/dapp-publishing) — pending review
- Dual recording architecture: client-side + Helius webhook (idempotent)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native 0.76.5 + TypeScript |
| Target Device | Solana Seeker (Android) |
| Wallet | Mobile Wallet Adapter (MWA) 2.0 |
| Tokens | USDC via SPL `transferChecked` (6 decimals) |
| Chain | Solana mainnet-beta |
| RPC | Helius |
| Backend | Supabase (PostgreSQL + Realtime + Edge Functions) |
| Auth | Wallet-signed message + ed25519 verify + JWT |

## Project Structure

```
screens/           — App screens (Give, Messages, Campaigns, Onboarding)
components/        — Providers (Connection, Wallet) and shared UI
services/          — Auth, donations, chat, Supabase client
utils/             — Transfer builder, error handling, retry queue
config/            — Environment config (cluster, RPC, mints)
navigation/        — Bottom tab navigator
supabase/          — Edge functions + database migrations
dapp-store/        — Solana dApp Store submission assets
docs/              — Design docs, pitch decks, handoffs, research
```

## Build & Run

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Build and run on Android device/emulator
npm run android

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Production bundle check
npx react-native bundle --platform android --dev false \
  --entry-file index.js --bundle-output /tmp/glimpse.bundle
```

Requires a Solana Seeker device or Android emulator with a MWA-compatible wallet installed.

## Entity Structure

- **Give Glimpse** — Planned 501(c)(3) nonprofit. Receives and routes 100% of donor USDC. Zero fee.
- **Glimpse** — Public Benefit Corporation (Delaware). Builds the app. Earns revenue via business partnerships.

## Links

- [Solana dApp Store Submission](https://explorer.solana.com/tx/4NsEgmAt2PpuCqTaPi5NJiE5SdCW6wpPuSNDax79bTfDr4mrZ55zgJxXDU7BEVAQg68ou8PH29FWCtDcCjS3Em1H)
- [Founder Story](docs/SOUL.md)
- [Design System](docs/design/brand-guide.md)

## License

All rights reserved. Copyright 2026 Glimpse PBC.
