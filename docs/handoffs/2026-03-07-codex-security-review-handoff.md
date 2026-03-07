# Codex Security Review Handoff

**Date:** 2026-03-07
**From:** Claude Opus (security audit session)
**To:** Codex (second review + collaborative hardening plan)
**Deadline:** Hackathon submission Sunday March 9, 7PM

---

## Goal

1. **Second-check the audit findings below** — verify each one by reading the actual source files. Flag any false positives, missed issues, or severity disagreements.
2. **Create a prioritized implementation plan** for mission-critical fixes only — things that could embarrass us in a hackathon demo, get flagged in dApp Store review, or cause real financial/security harm.
3. **Skip anything that doesn't affect the hackathon submission or mainnet safety.** Post-hackathon items stay deferred.

---

## Reference Docs (read these first)

| Doc | Path | What it covers |
|-----|------|----------------|
| Project architecture | `CLAUDE.md` | Full app architecture, data flow, stack, auth flow, donation flow |
| Default operating skill | `.claude/skills/solana-seeker-dev/SKILL.md` | MWA patterns, SPL transfer patterns, server validation, security checklist |
| Current status | `STATUS.md` | What works, what's in progress, sprint items |
| Deferred work | `TODOS.md` | Known gaps with full context |
| Founder voice | `docs/SOUL.md` | Product soul, key lines, anti-patterns |
| Brand guide | `docs/design/brand-guide.md` | Design system, typography, colors |

---

## App Context

Glimpse is a React Native USDC donation app on Solana Seeker (Android). North Star flow works end-to-end on mainnet:

```
connect wallet -> donate USDC -> confirm on-chain -> record in backend -> open message thread
```

Stack: React Native 0.76.5, @solana/web3.js v1, @solana/spl-token v0.3.11, MWA 2.0, Supabase (Postgres + Realtime + Edge Functions), Helius RPC + webhook.

---

## Audit Findings to Verify

### CRITICAL

**C1. Helius API key hardcoded in client bundle**
- File: `config/env.ts:13`
- The key `bedb2822-5ff9-411a-ac1d-57bd2d354810` is in committed source and ships in the APK bundle.
- Comment on line 12 acknowledges this as hackathon expedient.
- **Verify:** Is this key actually extractable from a release APK? Is there a proxy edge function we could route through?
- **Hackathon risk:** LOW (key is rate-limited, Helius can rotate). But flag for post-hackathon.

**C2. Webhook auth fails open when env var unset**
- File: `supabase/functions/helius-webhook/index.ts:39-48`
- `if (WEBHOOK_AUTH_TOKEN)` — if env var is empty, auth is skipped entirely. Deployed with `--no-verify-jwt`.
- **Verify:** Check the actual conditional. Confirm that an empty string from `Deno.env.get('HELIUS_WEBHOOK_AUTH_TOKEN') || ''` (line 15) would bypass the check.
- **Hackathon risk:** HIGH. An attacker who knows the endpoint URL can inject fake donation records.
- **Fix:** Add early return when token is not configured.

**C3. Keystore passwords in plaintext**
- File: `android/keystore.properties:3-4`
- Password: `glimpse2026`. File is gitignored but check if it was ever committed to git history.
- **Verify:** Run `git log --all --follow -- android/keystore.properties` to check history.
- **Hackathon risk:** LOW unless git history is public.

### HIGH

**H1. PostgREST filter injection in chat queries**
- File: `services/chat.ts:56`
- `.or(\`donor_wallet.eq.${walletAddress},admin_wallet.eq.${walletAddress}\`)`
- Wallet address from `publicKey.toBase58()` is interpolated into PostgREST filter string.
- **Verify:** Can a base58 PublicKey string ever contain commas or PostgREST operators? If not, this is a false positive for practical purposes.
- **Fix if real:** Use separate `.eq()` filter calls.

**H2. Media upload path traversal**
- File: `services/chat.ts:419`
- `const filePath = \`${conversationId}/${Date.now()}-${fileName}\`;`
- `fileName` comes from device image picker (`pickedImage.fileName`).
- **Verify:** Does Supabase Storage sanitize paths on the server side? Check if `../../` in a filename actually works against the storage API.
- **Fix:** Strip path separators from fileName before use.

**H3. JWT stored in unencrypted AsyncStorage**
- File: `services/supabase.ts:75`
- 24h JWT at `@glimpse_wallet_jwt`. Unencrypted SQLite on Android.
- **Verify:** Confirm this is standard AsyncStorage (not encrypted). Check if `react-native-keychain` is already in dependencies.
- **Hackathon risk:** LOW (requires rooted device + physical access).

**H4. `bigint-buffer` buffer overflow in spl-token path**
- Transitive via `@solana/spl-token` -> `@solana/buffer-layout-utils` -> `bigint-buffer`
- **Verify:** Check if `bigint-buffer` is actually called in our code path (ATA derivation + transferChecked).
- **Hackathon risk:** LOW (requires crafted BigInt input, not user-controllable in our flow).

### MEDIUM (verify but likely defer)

| # | Finding | File | Quick check |
|---|---------|------|-------------|
| M1 | Webhook trusts Helius POST without RPC verification | `helius-webhook/index.ts:91-193` | Compare to `record-donation` validation pipeline |
| M2 | Explorer URL not base58-validated | `utils/explorer.ts:3-7` | Can signature contain `../`? |
| M3 | Error messages leak internals | `utils/errors.ts:62,127` | Check what raw errors look like in practice |
| M4 | In-memory rate limits reset on cold start | `wallet-auth`, `record-donation` | Acceptable for hackathon |
| M5 | Float precision in memo amount | `utils/transfer.ts:148` | Server has 1-microUSDC tolerance, is that enough? |
| M6 | No auto-retry on blockhash expiry | `utils/transfer.ts:171` | User gets clear error, manual retry works |

### THINGS DONE WELL (don't break these)

- Server-side tx validation pipeline: 10/10 checklist items pass
- Top-level-only instruction scanning prevents CPI spoofing
- USDC mint + pool ATA + authority + memo cross-validation
- Two-layer mutation guard (module + component)
- Orphaned tx recovery with 7-day eviction
- Replay guard on wallet-auth
- Idempotent donation recording via tx_signature
- SGT verification with 3 independent checks

---

## What I Need From You

### Step 1: Verify findings (read-only)
Read each file referenced above. For each finding, respond with:
- **CONFIRMED** / **FALSE POSITIVE** / **SEVERITY CHANGE** (with reasoning)
- Any additional findings I missed

### Step 2: Mission-critical fix plan
Create a prioritized list of fixes that meet ALL of these criteria:
- Could cause real harm (financial, reputational, or security) during hackathon demo or dApp Store review
- Fixable in < 2 hours total
- Won't break the working mainnet donation flow

Format each fix as:
```
## Fix [number]: [title]
File(s): [paths]
What: [1-2 sentence description]
How: [specific code change]
Risk: [what could go wrong with this fix]
Test: [how to verify it worked]
```

### Step 3: Collaborative execution plan
Outline how we (Claude Opus + Codex) split the work:
- Which fixes can be done in parallel (no file conflicts)
- Which must be sequential (shared files)
- Quality gate: what to run after all fixes (`npx eslint . --ext .ts,.tsx --max-warnings=0 && npx tsc --noEmit && npm test -- --watchAll=false`)

---

## Constraints

- **Do not touch the donation flow** (`utils/transfer.ts` transaction building, `services/donations.ts` orchestration) unless the fix is isolated and testable.
- **Do not upgrade dependencies.** The stack is locked (see CLAUDE.md).
- **Do not add new packages** without explicit approval.
- **Hackathon mode is active** — risk tolerance is elevated, but don't introduce new bugs.
- **Run quality gates** after any changes: lint, typecheck, test, bundle check.
