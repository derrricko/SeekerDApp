# Final Check

## Launch Sequence

1. Fund the publisher wallet.
   - Send `~0.2 SOL` to: `E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY`
   - Check balance:
     ```bash
     solana balance E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY --url https://api.mainnet-beta.solana.com
     ```

2. Replace placeholder store images with real app captures from release build.
   - `dapp-store/screenshots/01-campaigns.png`
   - `dapp-store/screenshots/02-give-flow.png`
   - `dapp-store/screenshots/03-confirmation.png`
   - `dapp-store/screenshots/04-messages.png`

3. Confirm listing URLs and package are final.
   - File: `dapp-store/config.yaml`

4. Run validation.
   ```bash
   BUILD_TOOLS="$HOME/Library/Android/sdk/build-tools/34.0.0"
   npx @solana-mobile/dapp-store-cli validate -k dapp-store/publisher-keypair.json -b "$BUILD_TOOLS"
   ```

5. Submit in publisher flow.
   - Create publisher/app/release
   - Submit for review
   - Complete portal steps (KYC/KYB + storage provider + signatures)

## Additional Discoveries (to append)

- dApp Store docs currently recommend approximately `0.2 SOL` for submission wallet funding.
- Ensure dApp Store docs and internal runbooks match this funding requirement.
- Complete Solana Mobile Publisher Portal setup steps:
  - Create publisher profile in portal.
  - Complete required identity verification (KYC/KYB) in portal.
  - Connect the publisher wallet in browser extension for signing.
  - Select storage provider in portal flow (currently ArDrive).
- If also publishing to Google Play with same package (`com.seekerdapp`), use a separate signing key for dApp Store builds.
- Replace any placeholder dApp Store screenshots/assets with real release-build captures before final submit.
