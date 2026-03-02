# Surplus Donation Handling — Design

**Date:** 2026-03-01
**Status:** Approved (v2 — simplified)

## Problem

When a donor gives $25 but the matched need costs $23.99, there's a $1.01 surplus with no defined handling. Currently, the entire amount sits in the matching pool with no tracking or donor communication about the overage.

## Decision

Fixed policy, no donor choice. All surplus goes to the community pool, disbursed every 6 months. Communicated as a notice on the confirm screen and in the welcome message. No refund mechanism, no preference toggle, no async decisions.

## Donor Experience

Confirm screen shows the donation amount with a policy notice:

*"Any amount exceeding the matched need will be donated to the Glimpse community pool, disbursed every 6 months."*

One line of copy. No new UI controls. No toggle.

## Data Model

Two new columns on `donations` table:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `surplus_amount` | `numeric(18,6)` | `NULL` | Set by admin when actual cost is determined |
| `surplus_status` | `text` | `NULL` | `'pending'` when surplus identified, `'completed'` when acknowledged |

No `surplus_preference` column — policy is fixed (always pool).

Community pool totals queryable via: `SELECT SUM(surplus_amount) FROM donations WHERE surplus_amount IS NOT NULL`.

## Admin Workflow

1. Admin matches donation to a need, determines actual cost
2. Sets `surplus_amount = donation_amount - actual_cost`
3. Sets `surplus_status = 'pending'`
4. Surplus stays in pool. Mark `surplus_status = 'completed'` when acknowledged.

No refund path. Fully manual for launch.

## Edge Function Changes

No changes to `record-donation` request body. Surplus columns are admin-only (set via direct DB update, not via the edge function).

Welcome message updated to include policy notice:

*"Your donation of $X USDC is confirmed on-chain. In 24-48 hours we will message you with the specific need your donation is supporting. Any amount exceeding the matched need will be donated to the Glimpse community pool, disbursed every 6 months."*

## Migration

`012_surplus_tracking.sql` — single migration, two columns, no backfill.

```sql
ALTER TABLE donations
  ADD COLUMN surplus_amount numeric(18,6) DEFAULT NULL,
  ADD COLUMN surplus_status text DEFAULT NULL
    CHECK (surplus_status IN ('pending', 'completed'));
```

## In Scope

- Migration (2 columns)
- Confirm screen policy notice (one line of copy)
- Welcome message copy update
- TODOS.md note for future admin tooling

## Out of Scope

- Donor choice / preference toggle
- Refund mechanics
- Admin dashboard / tooling
- Separate surplus pool wallet
- Community pool disbursement automation
- Edge function request body changes
- On-chain program changes
