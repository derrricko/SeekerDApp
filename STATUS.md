# Mainnet Status — Launch Filter

Last updated: 2026-02-27  
Working branch: `codex/mainnet-readiness`

## Product Directive (Locked)

Keep in mind the main goal is getting this app to mainnet ASAP. Number 1 priority filter everything through that. Things like leaderboard are not a priority. The giving flow must be airtight. We must get to mainnet so we can start taking in donations, even if it is only one donation. We must deploy the app to the Solana dApp Store.

## North Star

Ship one path that works end-to-end on mainnet:

`connect wallet -> donate USDC -> confirm on-chain -> record in backend -> open message thread`

If that works reliably, we can launch and take donations.

## Strategy Rules

1. Freeze scope on anything not required for the North Star path.
2. Hardening beats new features.
3. dApp Store prep runs in parallel, but does not block transaction reliability work.

## Mainnet Blockers (Current)

1. Enforce cause selection as 2-3 causes in Give flow.
2. Remove config drift between app pool address and edge function pool/ATA constants.
3. Normalize server-side `recipient_id` metadata to avoid client drift.
4. Remove SOL fallback wording from donor-facing USDC flow.
5. Restore green quality gates: lint, typecheck, tests.
6. Align runbook docs to USDC mainnet path.

## Deprioritized Until First Mainnet Donation

1. Leaderboard implementation.
2. Group pooling mechanics beyond metadata.
3. Non-essential UI polish.
4. Legacy screen cleanup unless it affects launch reliability.

## Go/No-Go Launch Gates

1. One successful USDC mainnet donation from device.
2. Backend verifier accepts tx and creates donation + conversation row.
3. Success screen opens the correct thread immediately.
4. No SOL wording in donor-facing donation + messaging path.
5. Lint, `tsc`, and tests pass cleanly.
6. Signed release build installs and runs correctly.
7. Solana dApp Store submission assets and metadata are complete.

## Immediate Execution Order

1. Harden give flow validations and messaging reliability.
2. Lock pool address/ATA config consistency.
3. Run on-device mainnet E2E.
4. Produce release candidate build.
5. Submit to Solana dApp Store.
