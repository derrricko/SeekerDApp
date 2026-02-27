// v2 environment config — USDC-only donation flow (MAINNET)
export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

export const SOLANA_CLUSTER: SolanaCluster = 'mainnet-beta';
export const RPC_URL =
  'https://mainnet.helius-rpc.com/?api-key=595f9a7c-9775-4e7b-b1f7-eb69cd88558f';

export const APP_IDENTITY = {
  name: 'Glimpse',
  uri: 'https://giveglimpse.com',
  icon: 'favicon.ico',
};

// Supabase
export const SUPABASE_URL = 'https://knvagydrbbvuumabmxcg.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudmFneWRyYmJ2dXVtYWJteGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2MzA5MjEsImV4cCI6MjA1NDIwNjkyMX0.AE_8fhzb0Y4TN9_DAXLZ3QLUJNJogYCJN6bB8kqL_OE';

// Solana Memo Program v2
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

// Glimpse Seeker device wallet — receives all donations AND acts as admin
// for donor chat threads. Single wallet = full on-chain transparency.
export const ADMIN_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';

// Same wallet as admin — all donations go here, matching happens off-chain.
export const MATCHING_POOL_WALLET =
  'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';

// USDC mint by cluster.
const USDC_MINTS: Record<SolanaCluster, string> = {
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  testnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

export const USDC_MINT = USDC_MINTS[SOLANA_CLUSTER];
export const USDC_DECIMALS = 6;
