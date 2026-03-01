# Claude Handoff — USDC MVP (Simple Launch Scope)

Use this as the source of truth for the next implementation pass.

## Goal

Ship a **minimal, stable USDC donation flow** quickly so we can start getting real traction.

## Non-Negotiables

- USDC only.
- Keep implementation simple.
- No complex group pooling logic in this phase.
- No leaderboard work in this phase.

## Wallet + Pool Setup (Important)

- Matching pool destination should be the **company wallet public address** (from the separate Seeker device).
- App/backend may store only the **public address**.
- Never store private keys in app code or Supabase.

## Required Scope

### USDC donation flow

- Replace SOL transfer path with USDC SPL token transfer path.
- Keep one destination: matching pool wallet.
- Update user-facing labels from SOL to USDC.

### Give flow fields

- Amount input (USDC).
- Cadence: one-time or daily.
- Causes: choose 2–3 (for matching preferences, not direct routing).
- Optional giving style selector: Solo / Group.

### Solo/Group rule (keep simple)

- Treat Solo/Group as **metadata only**.
- Do not implement separate pool mechanics.
- Do not split routing by mode.
- All funds still go to the same matching pool wallet.

### 48-hour refund window

- Show clear copy in confirmation/success/thread context:
  - Donation is being processed.
  - Donor has 48 hours to request refund.
- Tracking can be simple DB status fields; no refund automation required now.

### Carousel and form consistency

- Carousel copy must match real app behavior.
- Do not promise automation/features not implemented yet.

### Safe migration approach

- Do **not** rename/remove old columns yet.
- Add new columns safely (additive migration), including:
  - `amount_usdc`
  - `donation_mode` (or `giving_style`)
  - `cause_preferences` (jsonb)
  - `hold_status`
  - `hold_expires_at`
- Keep read/write compatibility during transition.

## Explicitly Out of Scope (for now)

- Real group pooling logic.
- Leaderboard implementation.
- Matching algorithm engine.
- Automated refund execution.
- Large UI redesign.

## Delivery Checklist

- List changed files.
- Explain why each change was made.
- Include migration SQL.
- Include test commands and results.
- Include short “remaining risks” list.

## Success Criteria

- A donor can connect wallet, donate USDC, pick 2–3 causes, complete payment, and open message thread.
- No SOL wording remains in the primary donation and thread flow.
- Matching pool wallet is configurable as the company wallet public address.
- Build/tests pass and app runs cleanly on device.
