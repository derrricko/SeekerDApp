# Glimpse Backend — Plain English Guide

This document explains what Supabase does in Glimpse, what each piece is, and how it all connects. No jargon where possible.

---

## The Big Picture

Glimpse has two systems that work together:

1. **Solana (on-chain)** — Where the money actually moves. USDC transfers, escrow vaults, transaction signatures. This is the source of truth.

2. **Supabase (off-chain)** — A database and set of server functions that track what happened and who did it. Think of it as the app's memory — it remembers user profiles, records which transactions happened, and stores proof photos.

**The app works without Supabase.** Every Supabase call has a graceful fallback (static data, silent no-op). The on-chain donation flow is completely independent. Supabase adds:
- User profiles (display names, avatars)
- Transaction history (so users can see their past gifts)
- Need metadata from a database (funded amounts, status)
- Proof photos and receipts
- Authentication (Sign-In With Solana)

---

## The Database (5 Tables)

The database lives in Supabase PostgreSQL. The schema is defined in `supabase/migrations/`.

### `profiles`
One row per user. Created when someone signs in with their Solana wallet.

| Column | What it is |
|--------|-----------|
| id | Unique ID (auto-generated) |
| wallet_address | Their Solana wallet address (e.g., `HQ5C58...`) |
| display_name | Optional name they set in the app |
| avatar_url | Optional profile picture URL |
| created_at | When they first signed in |

### `needs`
The 5 charitable needs. Seeded from migration 003.

| Column | What it is |
|--------|-----------|
| slug | Short identifier (`shower`, `groceries`, `wardrobe`, `tires`, `rent`) |
| title | Human-readable name ("A clean shower and fresh clothes") |
| description | The story behind the need |
| amount | Target amount in USD ($25, $100, $250, $400, $1000) |
| funded | How much has been donated so far |
| status | `active`, `funded`, or `closed` |
| partner | Organization name if applicable ("BeHeard Movement") |

### `transactions`
Every recorded donation. One row per on-chain transaction.

| Column | What it is |
|--------|-----------|
| wallet_address | Who donated |
| need_id | Which need they funded (links to `needs` table) |
| tx_signature | The Solana transaction signature (proof it happened) |
| amount | How much USDC was transferred (derived from on-chain data) |
| note | Optional note of encouragement from the donor |

### `proofs`
Photos, receipts, and videos proving a need was fulfilled.

| Column | What it is |
|--------|-----------|
| need_id | Which need this proof belongs to |
| media_url | URL to the image/video in Supabase storage |
| media_type | `image`, `video`, or `receipt` |
| caption | Description of what the photo shows |

### `nonces`
Temporary tokens used for the sign-in process. They expire after 5 minutes and are deleted after use. You never interact with this table directly.

---

## The Edge Functions (3 Server Functions)

These run on Supabase's servers. The app calls them over HTTPS.

### 1. `nonce` — Get a sign-in challenge

**What it does:** Generates a random 32-byte number and stores it in the database with a 5-minute expiration.

**When it's called:** Step 1 of the sign-in flow. Before the wallet signs anything, the app asks for a nonce.

**Why it exists:** Prevents replay attacks. Without a nonce, someone could capture a signed message and use it to impersonate you.

**File:** `supabase/functions/nonce/index.ts`

### 2. `siws-verify` — Verify wallet signature and create session

**What it does:**
1. Takes the signed SIWS (Sign-In With Solana) message, the signature, and the public key
2. Verifies the ed25519 signature is valid (proves you own the wallet)
3. Checks the nonce is valid and not expired
4. Creates or updates your profile in the database
5. Generates a JWT (auth token) with your wallet address embedded

**When it's called:** Step 2 of sign-in. After the wallet signs the SIWS message.

**Why it exists:** This is how Glimpse knows who you are. The JWT it returns is used for all subsequent authenticated requests.

**File:** `supabase/functions/siws-verify/index.ts`

### 3. `record-transaction` — Verify and record a donation

**What it does:**
1. Takes a Solana transaction signature, wallet address, and optional need slug
2. Verifies the JWT is valid (you are who you say you are)
3. Fetches the actual transaction from Solana's RPC (the blockchain)
4. Verifies:
   - The transaction exists and succeeded
   - Your wallet address is a signer on it
   - The USDC amount is derived from on-chain balance changes (not trusted from the client)
   - If a need slug is provided, the vault PDA is in the transaction's accounts
5. Inserts the verified record into the `transactions` table

**When it's called:** After a successful donation, fire-and-forget. The on-chain transaction is already complete — this just records it in the database for history/display purposes.

**Why it exists:** The database can't trust the app to report accurate amounts — a modified app could claim it donated $1000 when it sent $1. By fetching the transaction from Solana and deriving the amount server-side, we ensure the database matches reality.

**File:** `supabase/functions/record-transaction/index.ts`

---

## The Auth Flow (Sign-In With Solana)

Here's what happens when someone taps "Sign In":

```
1. App → nonce function: "Give me a challenge"
   ← Function returns: random nonce (stored in DB for 5 min)

2. App → Wallet (Phantom): "Sign this message with nonce XYZ"
   ← Wallet returns: signed message + signature

3. App → siws-verify function: "Here's the signed message"
   ← Function verifies signature, creates profile, returns JWT

4. App stores JWT → All future requests include it
```

The JWT contains your wallet address. When you call `record-transaction`, it checks that the wallet address in your JWT matches the wallet that actually signed the Solana transaction.

---

## Row-Level Security (RLS)

RLS controls who can read/write what in the database. Think of it as permissions.

| Table | Who can read | Who can write |
|-------|-------------|---------------|
| profiles | Everyone | Only the profile owner (matching wallet) |
| needs | Everyone | Only the server (admin operations) |
| transactions | Everyone (transparency!) | Only the server (after on-chain verification) |
| proofs | Everyone | Only the server (admin uploads) |
| nonces | Nobody (except server) | Only the server |

"Everyone" means anyone with the anon key. "Server" means the edge functions using the service role key.

---

## Security Layers

The system has defense in depth:

1. **Wallet ownership** — You prove you own a wallet by signing a message with its private key
2. **Nonce anti-replay** — Each sign-in uses a one-time nonce that expires and is consumed
3. **JWT authentication** — All authenticated requests require a valid, signed token
4. **On-chain verification** — Transaction amounts are derived from the blockchain, not the client
5. **RLS policies** — Even if someone bypasses the edge functions, the database enforces access rules
6. **On-chain constraints** — The Rust escrow program validates USDC mint, admin authority, signer, and math independently

---

## Deployment Status

| Component | Status |
|-----------|--------|
| Database schema (migrations) | Written, NOT yet pushed to Supabase |
| Edge functions (nonce, siws-verify, record-transaction) | Written, NOT yet deployed |
| Supabase project config (config.toml) | Created |
| Supabase project (hosted) | Exists at `knvagydrbbvuumabmxcg.supabase.co` |

### To Deploy (When Ready)

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link to the project
supabase link --project-ref knvagydrbbvuumabmxcg

# 3. Push migrations
supabase db push

# 4. Deploy edge functions
supabase functions deploy nonce
supabase functions deploy siws-verify
supabase functions deploy record-transaction

# 5. Set edge function secrets
supabase secrets set JWT_SECRET=<your-jwt-secret>
supabase secrets set SOLANA_RPC_URL=https://api.devnet.solana.com
```

The JWT_SECRET is available in your Supabase dashboard under Settings > API > JWT Secret.

---

## What Still Needs to Be Done

1. **Push migrations** — Run `supabase db push` to create the tables
2. **Deploy edge functions** — Run `supabase functions deploy` for each function
3. **Set secrets** — The edge functions need `JWT_SECRET` and optionally `SOLANA_RPC_URL`
4. **Verify anon key** — The key in `config/env.ts` should match your dashboard's anon/public key
5. **End-to-end test** — Sign in with a wallet, make a donation, verify the record appears

---

*This file lives at `docs/backend-explained.md`.*
