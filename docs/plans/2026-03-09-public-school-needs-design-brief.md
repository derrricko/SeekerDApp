# Public School Needs — Fork Design Brief

**Date:** 2026-03-09
**Status:** Locked product direction for design + implementation handoff
**Use for:** Claude implementation, Codex design review, hackathon demo alignment

---

## 1. Working Naming

### Product / Feature Naming

- **Recommended internal concept name:** `Public School Needs`
- **Recommended tab toggle label:** `NEEDS`
- **Recommended section title:** `Public School Needs`
- **Recommended donor-facing phrasing:** `Classroom Need`

### Fork Naming

If this ships as a forked hackathon build, keep the repo name descriptive and neutral:

- `glimpse-public-school-needs` (recommended)
- `glimpse-public-school-funding`
- `glimpse-classroom-needs`

Do **not** frame the fork around Amazon. Amazon is a fulfillment source, not the product identity.

---

## 2. Product Promise

### Primary Promise

> **Fund exactly what a public school teacher asked for.**

### Supporting Line

> Read why they need it. Track the purchase. See the classroom update when it is shared.

This phrasing keeps the promise concrete without falsely guaranteeing a teacher reply or classroom photo.

---

## 3. What This Product Is

Public School Needs is a proof-first giving flow where donors fund one exact classroom request from one teacher. The donor is not giving to an abstract cause bucket. The donor is funding a specific need, at a specific price, for a specific classroom.

The product is:

- a trust layer for classroom giving
- a verified needs board
- a proof timeline from funding to fulfillment

The product is not:

- an Amazon shopping app
- a generic marketplace
- a crowdfunding pool
- direct donor-teacher chat

---

## 4. Locked Product Rules

These rules are part of the product, not implementation details.

1. One donor funds one exact need.
2. One teacher can have one open request at a time.
3. Teachers submit requests externally. Glimpse copies teacher-provided content into listings with minimal editing.
4. Donors browse needs inside the app. They do not choose from a campaign dropdown.
5. A need must lock immediately after successful funding confirmation.
6. Admin review is intentional. It exists to verify item, price, source, and fulfillment before purchase.
7. Guaranteed proof is purchase-side proof: order receipt, purchase confirmation, and delivery proof.
8. Teacher response and classroom photo are encouraged but not guaranteed.
9. Additional teacher listing access can be influenced later by response quality, proof quality, or referrals, but that is not hackathon scope.
10. Donor notes are one-way.

---

## 5. Content Sourcing

### Teacher Intake Model

Listings should be generated from an external teacher submission flow and inserted into the app with minimal rewriting.

### Visible Listing Fields

- item title
- short teacher explanation in their own words
- teacher first name
- school name
- city and state
- exact funding amount
- product image or classroom context image

### Hidden / Admin-Only Fields

- shipping address
- source URL
- admin review notes
- fulfillment notes
- proof review state

### Product Source Rule

Use the source URL operationally. Do not design the product around outbound Amazon browsing. The donor should fund a teacher need, not feel like they are leaving for a retail page.

---

## 6. Information Architecture

### Glimpses Tab Order

The Glimpses tab segmented control should become:

1. `NEEDS`
2. `FEED`
3. `MY GLIMPSES`

`NEEDS` is the default view.

### Needs Screen Structure

The screen should feel like a premium editorial feed, not a dense marketplace grid.

Recommended order:

1. Header + segmented control
2. Intro line explaining the product
3. `Open Needs` list
4. `Recently Funded` or `In Motion` strip/list
5. `Delivered` proof section lower on the screen

This structure lets the feed do two jobs:

- top of screen = action
- lower screen = social trust and proof

---

## 7. Experience Direction

### Intent

- **Who is this for:** a donor on Seeker who wants proof, specificity, and emotional clarity fast
- **What they must do:** choose one need confidently and fund it without ambiguity
- **How it should feel:** premium, editorial, restrained, human, concrete

### Signature Element

The signature of this feature should be:

- a need card that combines an exact price, a teacher voice excerpt, and proof/status treatment in one surface

This is not a donation card with a different label. It is a receipt-in-waiting.

### Visual World

The design should borrow from:

- school forms
- paper lists
- purchase receipts
- verified records

But it must remain inside the Glimpse brand system:

- Cormorant Garamond for editorial emphasis and amounts
- Courier Prime for labels, metadata, and proof language
- Glimpse purple as action
- teal reserved for proof and verification states

---

## 8. Screen Architecture

### Screen 1: Needs Feed

Purpose: browsing and trust formation.

Each card should show:

- image
- exact amount
- title
- teacher name + school
- city/state
- short teacher explanation
- status chip
- `FUND THIS` CTA when open

Behavior:

- open needs are tappable
- funded / delivered needs are still visible as proof objects
- single-column layout only

### Screen 2: Need Detail

Purpose: confidence before payment.

This screen should include:

- large image
- exact amount
- full title
- teacher identity block
- school + location
- full teacher explanation in their own words
- simple proof expectation block:
  - purchase proof guaranteed
  - classroom update shared when provided
- `FUND THIS NEED` CTA

Optional secondary content:

- small disclosure that Glimpse reviews the request before purchase

### Screen 3: Give Screen in Need Mode

Purpose: convert intent to donation without ambiguity.

In need mode:

- campaign dropdown disappears
- quick amount chips disappear
- amount is locked
- item context is pinned at the top
- donor note stays available

The donor must feel:

- I am funding this exact item
- not making a generic donation

### Screen 4: Processing / Receipt

Purpose: reassurance after funding.

Immediate sequence:

1. `FUNDED`
2. `UNDER REVIEW`
3. route to thread / proof timeline

This moment should clearly communicate that Glimpse now verifies and completes the purchase.

### Screen 5: Message Thread / Proof Timeline

Purpose: turn fulfillment into retained trust.

The thread header should carry the item context, not just the donation amount.

Timeline proof moments:

1. funding confirmed
2. under review
3. purchased
4. delivered
5. classroom photo added

The thread becomes the living receipt.

---

## 9. Donor-Facing State Model

These states are locked.

- `Open`
- `Funded`
- `Under Review`
- `Purchased`
- `Delivered`
- `Classroom Photo Added`

### State Meaning

- `Open`: available to fund
- `Funded`: donor payment confirmed, item locked
- `Under Review`: Glimpse verifying source, price, and fulfillment details
- `Purchased`: item bought, receipt or order confirmation attached
- `Delivered`: shipping completion or delivery proof attached
- `Classroom Photo Added`: optional follow-up classroom proof

### UI Guidance

- use purple for action
- use teal for verified proof moments
- use muted neutrals for in-between or review states
- do not present review as failure

---

## 10. Proof Model

### Guaranteed Proof

- funding confirmation
- purchase confirmation
- order / receipt proof
- delivery proof when available

### Encouraged But Optional Proof

- teacher thank-you note
- classroom photo
- follow-up message

### Product Policy

Teacher follow-up should be rewarded operationally later, but the UI must not promise it as guaranteed.

Recommended donor copy:

- `Purchase proof is guaranteed. Classroom updates are shared when the teacher sends them.`

---

## 11. Interaction Design Rules

These are locked for the first design pass.

- one focal motion at a time
- interactions complete within 100-300ms
- use transform + opacity wherever possible
- no heavy list choreography
- no more than subtle tap scale on cards and buttons
- detail transitions should preserve context, not feel theatrical

Recommended interaction moments:

- segmented control pill slide
- card press scale to `0.98`
- detail screen or sheet rise with opacity
- status chip fade/update

Avoid:

- parallax
- large blur animation
- long staggered entrances
- multiple competing highlights

---

## 12. Touch, Accessibility, and Device Rules

- minimum 44x44 touch targets
- body text should stay readable on Seeker without zoom
- CTA hierarchy must remain obvious in light mode
- reserve image space to prevent content jump
- no card layout that requires precision tapping

Single-column feed is required for readability and touch reliability.

---

## 13. Copy Rules

Copy should follow Glimpse voice:

- direct
- concrete
- proof-first
- no shopping language
- no guilt language
- no hype language

Use:

- `fund`
- `need`
- `proof`
- `delivered`
- `teacher`
- `classroom`

Avoid:

- `shop`
- `buy now`
- `deal`
- `wishlist`
- `marketplace`

Do not promise a teacher reply. Do not imply children will appear in photos.

---

## 14. Demo Content Rules

Use seeded demo needs if necessary, but do not fake outcomes.

Allowed:

- seeded listings
- representative teacher requests
- real UI states populated for demo

Not allowed:

- fake proof presented as real
- fabricated delivery updates presented as completed live events

If proof is seeded, label it internally and keep pitch language precise.

---

## 15. Deferred From Hackathon Scope

These ideas are good, but not part of the first build:

- referral-based extra listings
- teacher coaching flows
- teacher analytics
- public teacher profiles
- rich search / category filters
- full Sp3nd automation
- multiple open listings per teacher

---

## 16. Implementation Guidance For Claude

The implementation can reuse existing donation plumbing internally, but the donor experience must not expose that abstraction.

Required outcomes:

- add `NEEDS` as the first/default Glimpses mode
- add a dedicated need list and need detail view
- add Give screen `need mode`
- link donations to a specific need
- lock the need immediately after confirmed funding
- represent admin review explicitly in UI and data
- post proof updates into the existing message thread

Do not solve this as a dropdown variation.

Do not collapse this into a generic public-schools donation card.

---

## 17. Recommended Next Artifact

The next design deliverable should be a screen-by-screen layout spec with:

1. Needs feed card anatomy
2. Need detail hierarchy
3. Give screen in need mode
4. Proof timeline anatomy inside Messages
5. Status chip styles and copy

That artifact should be specific enough for Claude to build without inventing product behavior.
