# Legal Cleanup Deploy Handoff — 2026-03-03

## What Changed

Commit `6ff9c20b` scrubbed all surplus/pool/airdrop/escrow/revenue language and added regulatory disclaimers across the codebase. Key files:

- `supabase/functions/record-donation/index.ts` — welcome message rewritten, pool references removed
- `docs/launch/privacy-policy.html` — disclaimer banner added, custodial/matching language removed
- `dapp-store/review.html` — "directly to people in need" → "toward helping people in need", disclaimers added
- `docs/launch/dapp-store-listing-copy.md` — SLA timelines removed, disclaimers added
- `screens/HowItWorksCarousel.tsx` — "5-7 days after funds are locked" → "As your donation is put to work"
- `CLAUDE.md` — 48-hour hold, escrow, and pool references removed
- `docs/plans/2026-03-01-surplus-handling-design.md` — deleted

## Deploy Steps

Run these in order from the `SeekerDApp` directory.

### 1. Push to remote

```bash
git push origin main
```

### 2. Deploy record-donation edge function

The welcome message changed. Must redeploy.

```bash
npx supabase functions deploy record-donation --project-ref knvagydrbbvuumabmxcg
```

### 3. Deploy wallet-auth edge function (no changes, but keep in sync)

```bash
npx supabase functions deploy wallet-auth --project-ref knvagydrbbvuumabmxcg
```

### 4. Push privacy policy to GitHub Pages

The updated `docs/launch/privacy-policy.html` needs to go to the GitHub Pages repo that serves `giveglimpse.com/privacy`.

```bash
# Copy the updated file
cp docs/launch/privacy-policy.html /tmp/privacy.html

# Clone the GitHub Pages repo (if not already cloned)
cd /tmp
git clone https://github.com/derrricko/derrricko.github.io.git
cd derrricko.github.io

# Copy and commit
cp /tmp/privacy.html privacy/index.html
git add privacy/index.html
git commit -m "chore: update privacy policy — add disclaimers, remove custodial language"
git push origin main
```

If the Pages repo is already cloned locally, just copy the file, commit, and push.

### 5. Verify

- [ ] `git log origin/main --oneline -3` shows `6ff9c20b` pushed
- [ ] Visit app, make a test donation on devnet, verify welcome message says "We'll follow up in this thread with updates"
- [ ] Visit https://giveglimpse.com/privacy — verify disclaimer banner appears at top
- [ ] Open dApp Store review page locally (`dapp-store/review.html`) — verify disclaimers present

## Still TODO (not in this deploy)

- Rotate Helius API key (old key in git history)
- Re-enable SGT gating before mainnet launch
- Build release APK for dApp Store submission
- Photo wrapping issue in MessagesScreen.tsx (`aspectRatio: 4/3` may crop non-standard photos)
