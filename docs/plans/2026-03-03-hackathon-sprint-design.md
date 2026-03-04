# Hackathon Sprint Design — MONOLITH Submission

**Date:** 2026-03-03
**Deadline:** 2026-03-07 (Saturday submission)
**Hackathon:** MONOLITH — Solana Mobile Hackathon ($125K+ prize pool)
**Goal:** Win the hackathon AND position Glimpse for real cold-traffic donations

---

## Current State (What's Done)

| Area | Status |
|------|--------|
| North Star path (wallet → donate USDC → record → chat) | DONE — mainnet confirmed |
| Edge functions (wallet-auth, record-donation) | DONE — production-ready, no TODOs |
| Admin mode (isAdmin, Mark Completed, status updates) | DONE |
| dApp Store assets (config.yaml, icon, banner, 4 screenshots, copy) | DONE |
| Release APK (51.6 MB, signed, versionCode 1) | DONE |
| Publisher + App + Release NFTs minted on mainnet | DONE |
| Asset manifest (SHA256 + Arweave URIs) | DONE |
| Give flow (form → confirm → processing) | DONE |
| Feed + My Glimpses (real Supabase queries) | DONE |
| Messages + Chat (Realtime, media, admin replies) | DONE |
| Community outreach leads (42 scored accounts) | DONE |
| Mainnet config (hardcoded, keys rotated) | DONE |

---

## What Needs Doing

### Day 1 — Mon Mar 3: Verify & Capture

1. **Redeploy edge functions** (welcome message was scrubbed, needs fresh deploy)
   ```bash
   npx supabase functions deploy wallet-auth
   npx supabase functions deploy record-donation
   ```
2. **Confirm privacy policy live** at `https://giveglimpse.com/privacy`
3. **Run full donation flow on device** — capture screen recordings for demo video
4. **Confirm dApp Store listing** is pending/approved in publisher portal

### Day 2 — Tue Mar 4: Pitch Deck + Demo Video

**Pitch Deck (10 slides):**

1. **Hook** — "Most people's entire lives will be forever changed by a few thousand dollars."
2. **Problem** — GoFundMe takes 3%. Crypto giving is fragmented. No mobile-first solution.
3. **Solution** — Glimpse: zero-fee USDC donations, on-chain receipts, direct donor-recipient messaging.
4. **Live Demo** — Real mainnet screenshots on Seeker. Explorer tx link as proof.
5. **Why Solana Mobile** — Built natively for Seeker. MWA. dApp Store submitted. This is what the device was made for.
6. **Architecture** — One diagram: wallet → SPL transferChecked + memo → server validation → Supabase → chat thread.
7. **Founder Story** — "My son is one year old. Four years trying. NFT project, partner search, traditional fundraising — none of it worked. Built it myself."
8. **Traction** — Real mainnet donation. On-chain proof. dApp Store NFTs minted. 42 community leads identified.
9. **SKR Integration** (if built) — Buy a Seeker for a Glimpse partner. 2x points. Device goes directly to someone in need.
10. **Ask** — Featured dApp Store placement. First 100 donors through the Seeker community.

**Demo Video (2-3 min):**
- Screen capture on Seeker device
- Full flow: connect wallet → pick causes → enter amount → confirm → tx on Explorer → message thread opens
- Voiceover or text overlay with narrative

### Day 3 — Wed Mar 5: Outreach Blitz + Polish

**Morning — Outreach Wave 1:**
- Cold DM 12 Tier 1 leads (Seeker natives from `docs/outreach/seeker-community-2026-03-02.md`)
- Message template: "I built a zero-fee donation dApp on Seeker for MONOLITH. It's live on mainnet. Would love your take."
- Attach deck or demo link
- DM 6 dApp builder projects for cross-promotion (@cfldotfun, @mattlefun, @foreseelol, @CacheSeeker, @DinarioApp, @deplaydotfun)

**Afternoon — Polish:**
- Review deck and video with fresh eyes
- Test live demo path 3x — nothing can break mid-presentation

**Evening — Outreach Wave 2:**
- Top 15 Tier 2 leads
- Parents (@CaliBTC_, @amksy_, @btcbob, @MacOnChain, @OneManSaas): lead with founder story
- Builders (@keeffy99, @Ronmaris_, @CBNSdesigns): lead with builder respect

**Tactical rules:**
- Batch 10-15 genuine interactions per session (not spam)
- Track who responds — those are early adopters

### Day 4 — Thu Mar 6: SKR Integration + Final Push

**Morning — SKR "Buy a Seeker" Feature:**
- Add "Buy a Seeker" option to GiveScreen campaign dropdown
- Metadata-only: SKR intent flag, 2x points multiplier, partner routing
- If clean by noon → add slide 9 to deck
- If messy → cut it, don't jeopardize submission quality

**Afternoon — Final Outreach + Lockdown:**
- Wave 3: remaining Tier 2 leads
- Public X post: "Just submitted Glimpse to MONOLITH. Zero-fee USDC donations, live on mainnet, built for Seeker."
- **Lock deck and video — no more changes after tonight**

### Day 5 — Sat Mar 7: Submit

- Submit to hackathon portal (deck, video, links)
- Verify dApp Store listing status
- Rest

---

## Day-One Donation Expectations (Cold Traffic)

**Realistic:** 0-5 donations in the first week. Cold traffic converts at ~1-3%.

**Optimistic:** If a Tier 1 Seeker native shares it, 10-20 possible.

**If hackathon win:** Featured placement + marketing support = potentially hundreds. The hackathon IS the distribution channel.

**Key insight:** The pitch deck doubles as the cold-traffic conversion asset. Build it once, use it everywhere.

---

## SKR Integration Spec (Day 4, If Time)

**User-facing:** New option in GiveScreen campaign dropdown — "Buy a Seeker"

**Behavior:**
- Selecting "Buy a Seeker" sets donation mode metadata
- USDC amount flows through same SPL transferChecked path
- Memo includes SKR intent marker
- Backend records: `donation_mode: 'buy_seeker'`, `skr_bonus: true` (2x points)
- Device routing to Glimpse partner handled operationally (not in-app)

**Scope boundary:** This is metadata + UI only. No SKR token swaps, no on-chain SKR logic. The 2x points and partner routing are operational promises, not smart contract features.

---

## Risk Register

| Risk | Mitigation |
|------|------------|
| Demo breaks during recording | Test 3x before recording. Have Explorer screenshots as backup. |
| Edge function not deployed | Redeploy Day 1. Verify with test request. |
| Privacy policy URL down | Check Day 1. GitHub Pages is reliable fallback. |
| SKR integration scope creep | Hard cutoff at noon Day 4. If not clean, cut it. |
| Zero cold DM responses | Expected. The hackathon is the real distribution channel. DMs build awareness for post-hackathon. |
| dApp Store rejection | Submission is independent of hackathon. App works via direct APK regardless. |

---

## Hackathon Context

- **Prize:** $125K+ total. Ten $10K winners. Five $5K honorable mentions.
- **SKR Bonus:** $10K for best SKR integration.
- **Winners get:** Marketing support, featured dApp Store placement, Seeker devices, call with Toly.
- **What judges want:** Mobile-first apps built for the Solana dApp Store. Real usage > feature count.
- **Glimpse advantage:** Already on mainnet with a confirmed real donation. Most hackathon submissions are demos on devnet.

---

## Sources

- [MONOLITH Hackathon Announcement](https://blog.solanamobile.com/post/the-monolith-solana-mobile-hackathon)
- [Hackathon Portal](https://solanamobile.radiant.nexus/)
- Community leads: `docs/outreach/seeker-community-2026-03-02.md`
