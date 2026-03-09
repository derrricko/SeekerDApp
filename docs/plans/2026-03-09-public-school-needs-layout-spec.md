# Public School Needs — Layout Spec

**Date:** 2026-03-09
**Status:** Screen-level UX and layout specification
**Depends on:** `docs/plans/2026-03-09-public-school-needs-design-brief.md`

---

## 1. Design Intent

### Who This Human Is

A donor on Seeker. Curious, fast-scrolling, skeptical. They need to trust the request quickly and understand exactly what their money will do.

### What They Must Do

Browse specific teacher requests. Pick one confidently. Fund it without ambiguity. Return later for proof.

### How It Should Feel

Editorial. Precise. Premium. Human. Never retail. Never cluttered.

---

## 2. Domain Exploration

### Domain Concepts

- classroom request sheet
- supply list
- receipt stub
- teacher note
- school directory
- verified record

### Color World

Stay inside Glimpse tokens, but apply them with school-and-receipt intent:

- parchment-like light surfaces
- ink-like text
- purple for decisive action
- teal only for proof
- muted graphite for review and intermediate states

### Signature

The signature element is the **Need Card**:

- exact amount
- teacher voice excerpt
- school identity
- proof state

It should feel like a documented request that can become a receipt.

### Defaults To Avoid

- generic marketplace grid
- generic charity story cards
- generic e-commerce product detail page

Replace them with:

- single-column editorial list
- exact-amount pricing
- teacher explanation in-context
- proof-aware status treatment

---

## 3. Global Layout Rules

- single-column feed only
- fixed image heights to prevent jump
- strong vertical rhythm
- one primary CTA per screen
- no raw Amazon links on primary surfaces
- no more than 2 lines of metadata per card row before wrapping to next block

### Spacing

Use the Glimpse spacing rhythm. Bias toward:

- 12 for micro gaps
- 16 for related blocks
- 24 for section separation

### Type Hierarchy

- amount: Cormorant Garamond, largest on card
- title: Cormorant Garamond, moderate emphasis
- labels / metadata / status: Courier Prime
- teacher explanation: Courier Prime or system fallback only if needed for readability

### Surface Strategy

- hero cards: glass surface with soft border
- proof surfaces: same family, stronger internal hierarchy
- review states: quiet, not alarming

---

## 4. Screen 1 — Needs Feed

### Purpose

This is the feature’s front door. It needs to communicate:

- these requests are real
- the amounts are exact
- funding one will produce proof

### Top Area

Order:

1. App header
2. segmented control: `NEEDS | FEED | MY GLIMPSES`
3. one-line explainer

Recommended explainer:

`Requests come directly from public school teachers. Every funded need is reviewed before purchase.`

### Section Structure

1. `OPEN NEEDS`
2. `IN MOTION`
3. `DELIVERED`

All sections stay single-column.

### Open Need Card Anatomy

```text
┌──────────────────────────────────────┐
│ [image 16:9]                         │
│                                      │
│ $34.99                      OPEN     │
│ 30 Composition Notebooks             │
│ Sarah · Lincoln Elementary           │
│ Muscatine, IA                        │
│                                      │
│ "Most of my students come in with    │
│ one notebook for every subject..."   │
│                                      │
│ FUND THIS                            │
└──────────────────────────────────────┘
```

### Open Need Card Rules

- image first
- price top-left under image
- status chip top-right
- title next
- teacher and school line
- city/state line
- teacher excerpt capped at 3 lines
- full-width CTA pinned to the bottom of the card

### In Motion Card Variant

Same structure, but:

- CTA becomes `VIEW STATUS`
- status chip becomes `FUNDED`, `UNDER REVIEW`, or `PURCHASED`
- bottom row may show a proof hint:
  - `Receipt added`
  - `Delivery in progress`

### Delivered Card Variant

Same base structure, but the lower block changes to:

- proof line
- `VIEW PROOF` CTA
- optional small classroom-photo badge if present

### Empty State

If no open needs exist:

`No open needs right now. Delivered needs and proof remain below.`

---

## 5. Screen 2 — Need Detail

### Recommendation

Use a full screen, not a sheet.

Why:

- more room for teacher voice
- better for image + amount + status hierarchy
- cleaner transition into need-mode Give flow

### Layout Order

1. back/header
2. hero image
3. amount + status row
4. title
5. teacher/school/location block
6. teacher explanation block
7. proof expectation block
8. sticky bottom CTA

### Need Detail Wireframe

```text
┌──────────────────────────────────────┐
│ ← Need                               │
│ [large image]                        │
│                                      │
│ $34.99                    OPEN       │
│ 30 Composition Notebooks             │
│ Sarah                                │
│ Lincoln Elementary                   │
│ Muscatine, IA                        │
│                                      │
│ WHY THIS CLASSROOM NEEDS IT          │
│ "Most of my students..."             │
│ full teacher-provided explanation    │
│                                      │
│ WHAT HAPPENS NEXT                    │
│ Purchase proof is guaranteed.        │
│ Classroom updates are shared when    │
│ the teacher sends them.              │
│                                      │
│ [ FUND THIS NEED ]                   │
└──────────────────────────────────────┘
```

### Detail Page Rules

- no donation jargon at the top
- no campaign references
- no Amazon branding
- no external link prominence
- if source matters, include a low-emphasis trust line:
  - `Reviewed by Glimpse before purchase`

---

## 6. Screen 3 — Give Screen In Need Mode

### Principle

Need mode must feel like a dedicated flow, not a disguised version of the general donation form.

### Remove From Need Mode

- campaign dropdown
- quick amount chips
- open amount entry
- general campaign summary text

### Keep In Need Mode

- item summary
- locked amount
- optional donor note
- confirm flow
- processing and receipt pattern

### Top Card

Pinned summary card:

- thumbnail image
- item title
- teacher + school
- exact amount
- subtle status line:
  - `Funding this need opens a proof timeline in Messages.`

### Form Area

Only one editable field by default:

- donor note

### Confirm Step

Should read like a receipt review:

- item
- teacher
- amount
- note preview if present

Primary CTA:

- `CONFIRM & SIGN`

### Processing Step

Should not stop at “donation confirmed.”

It should say:

- `NEED FUNDED`
- `Glimpse is now reviewing this request before purchase.`

Primary CTA:

- `VIEW PROOF THREAD`

Secondary CTA:

- `BACK TO NEEDS`

---

## 7. Screen 4 — Proof Timeline In Messages

### Thread Header

The header should carry need context, not just donation context.

Header content:

- item title
- amount
- teacher/school
- current state
- optional explorer link in low-emphasis placement

### Timeline Blocks

Treat major proof updates as structured blocks inside the thread.

#### Event 1: Funded

- label: `FUNDED`
- message: `Your funding is confirmed on-chain.`

#### Event 2: Under Review

- label: `UNDER REVIEW`
- message: `Glimpse is verifying the request and purchase details.`

#### Event 3: Purchased

- label: `PURCHASED`
- include receipt/order artifact
- optional order number

#### Event 4: Delivered

- label: `DELIVERED`
- include delivery proof or carrier confirmation

#### Event 5: Classroom Photo Added

- label: `CLASSROOM PHOTO ADDED`
- include photo card
- optional teacher note

### Thread Tone

Structured updates should feel more official than freeform chat.

Recommended distinction:

- proof blocks = card-like
- human messages = normal bubbles

---

## 8. Status Chips

### Visual Behavior

- compact pill
- Courier Prime uppercase
- small but legible
- consistent placement across cards

### Recommended Mapping

- `OPEN`: purple text / light action tint
- `FUNDED`: muted neutral
- `UNDER REVIEW`: muted neutral with subtle border
- `PURCHASED`: teal-assisted emphasis
- `DELIVERED`: teal
- `CLASSROOM PHOTO ADDED`: teal + optional small image badge

Do not use red unless something has actually failed.

---

## 9. Microcopy

### Feed

- `OPEN NEEDS`
- `IN MOTION`
- `DELIVERED`

### Card CTAs

- `FUND THIS`
- `VIEW STATUS`
- `VIEW PROOF`

### Detail

- `WHY THIS CLASSROOM NEEDS IT`
- `WHAT HAPPENS NEXT`

### Give Mode

- `FUND THIS NEED`
- `ADD A NOTE`
- `CONFIRM & SIGN`
- `VIEW PROOF THREAD`

### Review Language

Use:

- `reviewing`
- `verifying`
- `processing`

Avoid:

- `pending approval`
- `waiting`
- `manual fallback`

Review should feel intentional and trustworthy.

---

## 10. Motion Spec

### Segmented Control

- 180-220ms
- ease-out
- sliding active pill

### Card Press

- scale to `0.98`
- 100-120ms

### Detail Transition

- 220-260ms
- fade + slight upward settle

### Status Updates

- 160-200ms opacity/translate combo

### Prohibited

- entrance staggers above 30ms per item
- blur-heavy transitions
- list-wide choreography
- animation that competes with CTA or proof changes

---

## 11. Demo Sequencing

To show the full story in a demo:

1. Start on `NEEDS`
2. Open a compelling `OPEN` need
3. Show the teacher explanation
4. Fund the need
5. Land in proof thread
6. Navigate back and show one `PURCHASED` example
7. Navigate to one `DELIVERED` example with classroom photo

This demonstrates:

- discovery
- specificity
- payment
- proof
- retention loop

---

## 12. Non-Negotiables For Implementation

- do not design the need feed as a grid
- do not send donors directly from card tap to wallet signing
- do not expose campaign UI in need mode
- do not foreground Amazon branding
- do not allow a funded need to remain fundable
- do not promise teacher reply or photo as guaranteed

---

## 13. Recommended Next Review Pass

Once Claude implements this, audit:

1. whether need mode truly feels distinct from general donation mode
2. whether proof states read clearly at a glance
3. whether the feed remains premium rather than retail
4. whether motion stays quiet and performant on Seeker
