# Codex Task: Solana dApp Store Submission Assets

**Branch:** `v2/mainnet-launch`
**Priority:** Ship before first mainnet donation
**Context:** Code is quality-gate clean (lint, tsc, jest all pass). These are the non-code assets required for Solana dApp Store listing.

---

## Required Assets

### 1. Privacy Policy
- **What:** A hosted privacy policy page (URL required for store submission)
- **Tone:** Transparent, founder-voice, aligned with `docs/SOUL.md`
- **Must cover:**
  - Wallet address collection (public key only, no seed phrases)
  - On-chain transaction data (public by nature of Solana)
  - Supabase-stored data: donations table, conversations, messages
  - Chat media stored in private Supabase Storage bucket (signed URLs, 1h expiry)
  - No email/password collection (wallet-only auth)
  - No third-party analytics or tracking SDKs
  - USDC donation amounts visible on-chain
  - 48-hour custodial hold period before matching
  - Data retention: indefinite for on-chain, conversations retained for donor transparency
- **Hosting:** GitHub Pages, Notion public page, or simple HTML on glimpse domain
- **Deliverable:** URL to hosted page

### 2. App Screenshots (3-5)
- **Device:** Solana Seeker or Android emulator (Pixel 6 API 35)
- **Required screens:**
  1. **Campaigns/Glimpses tab** — campaign cards visible
  2. **Give flow** — campaign selected, USDC amount entered
  3. **Transaction confirmation** — MWA wallet prompt or post-confirm screen
  4. **Messages tab** — conversation list with welcome message visible
  5. **Chat thread** — inside a conversation showing timeline message
- **Format:** PNG, 1080x1920 or device-native resolution
- **Style:** Clean, no debug overlays, release build only

### 3. Store Listing Copy
- **Short description** (80 chars max): One line explaining Glimpse
  - Draft: "Direct USDC donations with on-chain receipts and real impact updates."
- **Long description** (500 chars max): Expand on the mission
  - Must include: zero platform fees, USDC on Solana, cause matching, donor-recipient messaging, 48h hold transparency
  - Reference `docs/SOUL.md` sacred lines for voice
- **Category:** Social Impact / Finance

### 4. App Icon Verification
- **Check:** `android/app/src/main/res/mipmap-*/ic_launcher.png` exists at all densities
  - mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192)
- **Also check:** `ic_launcher_round.png` variants if adaptive icons are configured
- **If missing:** Create from brand assets or existing logo

### 5. Support Email
- **What:** Public contact email for dApp Store listing
- **Used for:** User support inquiries, dApp Store communication
- **Owner decision required:** Which email to use (personal, glimpse domain, etc.)

### 6. dApp Store Metadata File (if required)
- **Check:** Solana dApp Store may require a `dapp-store/` config directory or JSON manifest
- **Reference:** https://github.com/nicholasgasior/sms-publishing-spec (publishing spec)
- **App ID:** `com.seekerdapp`
- **Version:** 1.0 (versionCode 1)

---

## Key Addresses (for copy-paste into listings)

| Label | Value |
|-------|-------|
| **Mainnet USDC Mint** | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |
| **Pool Wallet** | `DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk` |
| **Pool USDC ATA** | `GUGy7SPXbETj4E4mNFGXY4jurm1DUjWp5KDTK1J11kwa` |
| **App ID** | `com.seekerdapp` |

---

## Acceptance Criteria
- [ ] Privacy policy URL live and accessible
- [ ] 3-5 screenshots from release build
- [x] Short + long description finalized
- [x] App icons verified at all densities
- [ ] Support email confirmed
- [x] dApp Store metadata file created (if required by publishing spec)

## Progress Notes (2026-02-28)
- Privacy policy draft page created at `docs/privacy-policy.html` (needs hosting + URL)
- Listing copy prepared at `docs/dapp-store-listing-copy.md`
- Metadata draft prepared at `dapp-store/metadata.json` (replace placeholders)
- Screenshot guide created at `docs/dapp-store-screenshot-runbook.md`
- Icon size audit recorded at `docs/dapp-store-icon-audit.md`
