/**
 * Centralized environment configuration.
 * All hardcoded values (cluster, mints, identity, Supabase) live here.
 */

import {PublicKey} from '@solana/web3.js';

// ─── Solana ─────────────────────────────────────────────────────────────────

export const SOLANA_CLUSTER: 'devnet' | 'mainnet-beta' = 'devnet';

export const RPC_URL = 'https://api.devnet.solana.com';

// ─── App Identity (MWA) ────────────────────────────────────────────────────

export const APP_IDENTITY = {
  name: 'Glimpse',
  uri: 'https://glimpse.give',
  icon: 'favicon.ico',
};

// ─── USDC ───────────────────────────────────────────────────────────────────

export const USDC_DECIMALS = 6;

const USDC_MINTS = {
  devnet: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'),
  'mainnet-beta': new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
};

export const USDC_MINT = USDC_MINTS[SOLANA_CLUSTER];

// ─── Escrow Program ────────────────────────────────────────────────────────

export const ESCROW_PROGRAM_ID = new PublicKey(
  '7Ma28eiEEd4WKDCwbfejbPevcsuchePsvYvdw6Tme6NE',
);

// ─── Recipient wallet (org treasury — fallback for direct transfers) ───────

export const RECIPIENT_WALLET = new PublicKey(
  '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
);

// ─── Supabase ───────────────────────────────────────────────────────────────

export const SUPABASE_URL = 'https://knvagydrbbvuumabmxcg.supabase.co';
export const SUPABASE_ANON_KEY =
  'sb_publishable_INS4usT4WBv9Z5nZ2Y-i2g_RZC7WG9N';
