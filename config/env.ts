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
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudmFneWRyYmJ2dXVtYWJteGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjU2NTMsImV4cCI6MjA4NjQwMTY1M30._YRE0u_16AGeHGsgmSHHIa9J5O6ZZQHo3gFNBFiMycc';
