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
  'mainnet-beta': new PublicKey(
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  ),
};

export const USDC_MINT = USDC_MINTS[SOLANA_CLUSTER];

// ─── Recipient wallet (org treasury) ────────────────────────────────────────

export const RECIPIENT_WALLET = new PublicKey(
  '11111111111111111111111111111111', // TODO: Replace with actual org wallet
);

// ─── Supabase ───────────────────────────────────────────────────────────────

export const SUPABASE_URL = ''; // Fill when Supabase project is created
export const SUPABASE_ANON_KEY = ''; // Fill when Supabase project is created
