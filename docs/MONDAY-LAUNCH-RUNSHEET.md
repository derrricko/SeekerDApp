# Glimpse v1.0 — Monday Launch Runsheet

## Pre-flight: Verify Environment

```
# 1. Verify edge function secrets are set (Helius RPC for server-side tx fetch)
npx supabase secrets list
# Confirm: SOLANA_RPC_URL, JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY all present

# 2. Verify quality gates
npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings=0 && npm test -- --watchAll=false

# 3. Verify bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output /tmp/test.bundle
```

---

## Phase 1: Release APK (30 min)

```
# Build release APK
cd android && ./gradlew assembleRelease && cd ..

# Output: android/app/build/outputs/apk/release/app-release.apk
```

Install on Seeker device via USB:
```
adb install android/app/build/outputs/apk/release/app-release.apk
```

**Verify on device:**
- [ ] App opens without crash
- [ ] Campaigns tab loads campaign cards
- [ ] Give tab is accessible
- [ ] No debug banners or yellow boxes

---

## Phase 2: E2E Mainnet Test (15 min)

**You need:** Seeker device, wallet app (Phantom/Solflare) with USDC balance + SOL for fees.

### Test script:
1. Open Glimpse on device
2. Tap **Give** tab
3. Select a campaign
4. Enter a small USDC amount (e.g., $0.50)
5. Tap **Continue** → review confirmation screen
6. Tap **Confirm** → wallet prompt appears
7. Approve in wallet app
8. Wait for confirmation (should take ~5-15 seconds)
9. Success screen should show with tx signature
10. App should navigate to Messages tab

### Verify backend:
```
# Check donation was recorded in Supabase
# Go to: https://supabase.com/dashboard/project/knvagydrbbvuumabmxcg/editor
# Query: SELECT * FROM donations ORDER BY created_at DESC LIMIT 1;
# Verify: tx_signature, donor_wallet, amount_usdc, hold_status='pending', cause_preferences populated

# Check conversation was created
# Query: SELECT * FROM conversations ORDER BY created_at DESC LIMIT 1;
# Verify: donation_id matches, donor_wallet matches, admin_wallet = pool wallet

# Check welcome message exists
# Query: SELECT * FROM messages ORDER BY created_at DESC LIMIT 1;
# Verify: body contains "Next steps" timeline copy
```

### Verify on-chain:
```
# Check transaction on Solana Explorer
# https://explorer.solana.com/tx/<TX_SIGNATURE>
# Verify: SPL transferChecked to pool ATA, Memo instruction with app="glimpse"
```

**GO/NO-GO gate:** If all 3 verifications pass (device UX, backend, on-chain), proceed to Phase 3.

---

## Phase 3: Store Assets (45 min)

### 3a. Privacy Policy Hosting
The privacy policy HTML is at `docs/privacy-policy.html`. Host it:

**Option A: GitHub Pages (recommended)**
```
# Create a separate repo or use existing giveglimpse.com repo
# Push privacy-policy.html as index.html to a gh-pages branch
# URL will be: https://<username>.github.io/<repo>/privacy-policy.html
```

**Option B: Upload to giveglimpse.com**
Upload `docs/privacy-policy.html` to your domain at `/privacy` or `/privacy-policy`.

Once hosted, update the URLs in `dapp-store/config.yaml` (license_url, privacy_policy_url, copyright_url).

### 3b. Store Icon (512x512)
- You're handling this separately
- Place the final file at: `dapp-store/icon-512.png`

### 3c. Screenshots (4 images, 1080x1920)
Take these from the **release build on device** (not emulator, not debug):

1. `dapp-store/screenshots/01-campaigns.png` — Campaigns/Glimpses tab with cards visible
2. `dapp-store/screenshots/02-give-flow.png` — Give screen with campaign selected + amount entered
3. `dapp-store/screenshots/03-confirmation.png` — Post-donation success screen or wallet prompt
4. `dapp-store/screenshots/04-messages.png` — Messages tab showing conversation with welcome message

**Take screenshots via:** `adb exec-out screencap -p > screenshot.png`

### 3d. Contact Email
The config.yaml uses `derrick@giveglimpse.com`. Update if needed.

---

## Phase 4: dApp Store Submission (30 min)

### 4a. Install CLI
```
cd /Users/derrickwoepking/Desktop/SeekerDApp
npm install --save-dev @solana-mobile/dapp-store-cli
```

### 4b. Fund Publisher Keypair
The publisher keypair is at `dapp-store/publisher-keypair.json`.
```
# Address: E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY
# Send ~0.05 SOL to this address for NFT minting fees
solana balance dapp-store/publisher-keypair.json
```

### 4c. Validate Config
```
npx dapp-store validate \
  -k dapp-store/publisher-keypair.json \
  -b ~/Library/Android/sdk/build-tools/34.0.0
```
(Adjust build-tools path if your version differs — check via Android Studio > SDK Manager)

### 4d. Mint NFTs (one-time setup)
```
# 1. Create Publisher NFT (once, ever)
npx dapp-store create publisher \
  -k dapp-store/publisher-keypair.json \
  -u https://api.mainnet-beta.solana.com

# 2. Create App NFT (once per app)
npx dapp-store create app \
  -k dapp-store/publisher-keypair.json \
  -u https://api.mainnet-beta.solana.com

# 3. Create Release NFT (once per version)
npx dapp-store create release \
  -k dapp-store/publisher-keypair.json \
  -b ~/Library/Android/sdk/build-tools/34.0.0 \
  -u https://api.mainnet-beta.solana.com
```

Each command auto-populates the `address` field in `config.yaml`. Do not edit those manually.

### 4e. Submit for Review
```
npx dapp-store publish submit \
  -k dapp-store/publisher-keypair.json \
  -u https://api.mainnet-beta.solana.com \
  --requestor-is-authorized \
  --complies-with-solana-dapp-store-policies
```

### 4f. Post-Submission
- Review takes **2-3 days** for new apps
- Solana Mobile team contacts via email or dApp Store Discord
- Monitor for feedback at the publisher email

---

## Go/No-Go Checklist

| # | Gate | Status |
|---|------|--------|
| 1 | Quality gates pass (tsc, eslint, jest, bundle) | |
| 2 | Release APK builds and installs on Seeker | |
| 3 | One real USDC mainnet donation completes E2E | |
| 4 | Donation row in Supabase with correct fields | |
| 5 | Conversation + welcome message created | |
| 6 | Messages tab shows thread with timeline copy | |
| 7 | On-chain tx has SPL transferChecked + Memo | |
| 8 | Privacy policy hosted at public URL | |
| 9 | 512x512 icon created | |
| 10 | 4 screenshots from release build on device | |
| 11 | Publisher keypair funded (~0.05 SOL) | |
| 12 | dapp-store CLI config validated | |
| 13 | Publisher + App + Release NFTs minted | |
| 14 | Submission sent with compliance flags | |

---

## Key Addresses

| Label | Value |
|-------|-------|
| Pool Wallet | `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk` |
| Pool USDC ATA | `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa` |
| Mainnet USDC Mint | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| Publisher Keypair | `E27rWm1vj46qjLReHVJNfesUqMLpHnD27EgoUp8torNY` |
| App ID | `com.seekerdapp` |
| Supabase Project | `knvagydrbbvuumabmxcg` |

---

## Seed Phrase Backup (MOVE THIS TO SECURE STORAGE IMMEDIATELY)

The publisher keypair seed phrase was displayed when generated. It is NOT stored in this file.
Back it up securely — anyone with this keypair can publish future versions of Glimpse.
