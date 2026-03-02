# Design: solana-seeker-dev Skill

**Date:** 2026-03-01
**Status:** Approved
**Author:** Derrick + Claude

## Problem

The existing `solana-dev` skill is a generic Solana development playbook (~2,300 lines across 11 files). About 60% of its content is inapplicable to Glimpse's stack:

- Recommends `@solana/kit`, `@solana/client`, `framework-kit` — incompatible with MWA
- 955 lines on Anchor/Pinocchio programs — Glimpse has no on-chain programs
- 350 lines on LiteSVM/Mollusk/Surfpool testing — Glimpse uses Jest
- 735 lines on confidential transfers — not relevant to USDC SPL transfers
- Zero coverage of MWA, SGT verification, dApp Store, or React Native polyfills

## Solution

Create `solana-seeker-dev` — a flat, focused 499-line skill covering exactly what Glimpse needs.

## Structure: Flat Single File (Approach A)

One `SKILL.md` with everything inline. No reference files. Rationale:
- Always in context — no progressive disclosure overhead
- Fast for a solo founder moving fast
- When Anchor programs are needed (~1-3 months post-launch), add `programs-anchor.md` as a reference file

## Sections

1. **Stack (Locked)** — version table with rationale for each pin
2. **Task Classification** — 4 layers (Wallet/MWA, Transaction, Server validation, Build/Deploy)
3. **MWA Patterns** — session model, two connection paths, address parsing, gotchas, wallet auth
4. **SPL Transfer Patterns** — 5-step build sequence, amount conversion, commitment strategy, orphaned tx recovery, error codes
5. **Server-Side Validation** — 12-step pipeline, top-level-only rule, jsonParsed decoding, wallet auth
6. **SGT Verification** — 3-check logic, manual TLV parsing, client vs server behavior
7. **React Native Polyfill Stack** — import order, globals.js, Metro config, critical pins
8. **dApp Store Pipeline** — NFT-based publishing, required assets, submission commands, Android build notes
9. **Seeker Device Constraints** — hardware specs and implications
10. **Security Checklist** — client-side, server-side, build/deploy checklists
11. **Resources** — curated links (Solana Mobile, core Solana, security, RN+Solana)

## What Was Dropped

| Original Section | Lines | Why Dropped |
|---|---|---|
| framework-kit frontend | 90 | Incompatible with MWA/web3.js v1 |
| kit-web3-interop | 50 | No Kit migration needed |
| Anchor programs | 295 | No custom programs |
| Pinocchio programs | 660 | No custom programs |
| Testing (LiteSVM/Mollusk/Surfpool) | 350 | Tests are Jest, not program tests |
| IDL/Codegen | 40 | No IDLs |
| Confidential transfers | 735 | Not relevant to USDC SPL |

## What Was Added

| New Section | Why |
|---|---|
| MWA session model + patterns | Core wallet integration, zero coverage in original |
| SGT verification + TLV parsing | Seeker-specific gating, not in any generic skill |
| dApp Store publishing pipeline | NFT-based publishing, APK format, submission commands |
| React Native polyfill stack | Import order, Metro stubs, critical pins |
| Seeker hardware constraints | Performance budget, display density, API level |
| Orphaned transaction recovery | Mobile-specific resilience pattern |
| Commitment strategy table | Client vs server commitment levels |

## Future Growth Path

When custom programs are needed (~1-3 months post-launch):
1. Add `programs-anchor.md` as a reference file
2. Add a "Program" layer to the task classification table
3. Add Anchor-specific items to the security checklist
4. Keep the flat SKILL.md as the operating procedure
