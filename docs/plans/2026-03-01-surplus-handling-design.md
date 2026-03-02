# Surplus Donation Handling — Design

**Date:** 2026-03-01
**Status:** Approved

## Problem

When a donor gives $25 but the matched need costs $23.99, there's a $1.01 surplus with no defined handling. Currently, the entire amount sits in the matching pool with no tracking or donor communication about the overage.

## Decision

Pre-selected preference at donation time. Donor chooses before donating; admin executes the policy when matching. No async follow-up decision needed.

## Donor Experience

After entering amount and selecting a campaign, a new field appears in the Give flow:

**"If your donation exceeds the matched need:"**
- Donate remainder to community pool (default)
- Refund the difference

Metadata only — doesn't change the on-chain transaction. Full amount goes to the matching pool as a single SPL transfer.

Confirm screen shows the amount with small copy: *"Any surplus will be [donated to the community pool / refunded to your wallet]."*

## Data Model

Three new columns on `donations` table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `surplus_preference` | `text NOT NULL` | `'pool'` | Donor's choice: `'pool'` or `'refund'` |
| `surplus_amount` | `numeric(18,6)` | `NULL` | Set by admin when actual cost is determined |
| `surplus_status` | `text` | `NULL` | `'pending'` when surplus identified, `'completed'` when processed |

No new tables. No new wallets. Surplus USDC stays in the existing matching pool wallet, tracked in the DB.

Community pool totals queryable via: `SELECT SUM(surplus_amount) FROM donations WHERE surplus_preference = 'pool' AND surplus_amount IS NOT NULL`.

## Admin Workflow

1. Admin matches donation to a need, determines actual cost
2. Sets `surplus_amount = donation_amount - actual_cost`
3. Sets `surplus_status = 'pending'`
4. Checks `surplus_preference`:
   - `pool` — no action. USDC stays in pool. Mark `surplus_status = 'completed'`.
   - `refund` — manually send surplus USDC to `donor_wallet`. Mark `surplus_status = 'completed'`.

Fully manual for launch. Admin panel deferred.

## Edge Function Changes

`record-donation` accepts `surplusPreference` in the request body:
- Validated: must be `'pool'` or `'refund'`, defaults to `'pool'`
- Stored in `surplus_preference` column on upsert

## Message Copy

Welcome message branches on preference:
- **pool:** "Your donation of $X USDC is confirmed on-chain. Any surplus after matching will be donated to the Glimpse community pool, disbursed every 6 months."
- **refund:** "Your donation of $X USDC is confirmed on-chain. Any surplus after matching will be refunded to your wallet."

No new message types. No interactive buttons.

## Migration

`012_surplus_tracking.sql` — single migration, three columns, no backfill.

## In Scope

- Migration (3 columns)
- Surplus preference selector in GiveScreen
- Confirm screen copy
- `record-donation` edge function accepts + stores preference
- Welcome message copy branching

## Out of Scope

- Admin dashboard / tooling
- Automated refund mechanics
- Separate surplus pool wallet
- Community pool disbursement automation
- On-chain program changes
