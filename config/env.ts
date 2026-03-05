// v2 environment config — USDC-only donation flow
// Toggle __DEV__ to switch between devnet (debug builds) and mainnet (release).
export type SolanaCluster = 'devnet' | 'testnet' | 'mainnet-beta';

// Hardcoded to mainnet — edge functions only validate against mainnet RPC.
// The __DEV__ toggle created a client/server mismatch: debug builds sent
// devnet transactions that the server could never find on mainnet.
// TODO: Add devnet support to edge functions before re-enabling the toggle.
export const SOLANA_CLUSTER: SolanaCluster = 'mainnet-beta';

// Helius RPC — faster reads, no rate limiting.
// Key is in the URL for hackathon. Post-hackathon: proxy through edge function.
export const HELIUS_API_KEY = 'bedb2822-5ff9-411a-ac1d-57bd2d354810';

const RPC_URLS: Record<SolanaCluster, string> = {
  devnet: 'https://api.devnet.solana.com',
  testnet: 'https://api.testnet.solana.com',
  'mainnet-beta': `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
};

export const RPC_URL = RPC_URLS[SOLANA_CLUSTER];

export const APP_IDENTITY = {
  name: 'Glimpse',
  uri: 'https://giveglimpse.com',
  icon: '/icon.png',
};

// Supabase
export const SUPABASE_URL = 'https://knvagydrbbvuumabmxcg.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtudmFneWRyYmJ2dXVtYWJteGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjU2NTMsImV4cCI6MjA4NjQwMTY1M30._YRE0u_16AGeHGsgmSHHIa9J5O6ZZQHo3gFNBFiMycc';

// Solana Memo Program v2
export const MEMO_PROGRAM_ID = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

// Single-wallet architecture for launch: pool + admin = same address.
// All donations go to this wallet. The admin identity for chat threads is the
// same key. This provides full on-chain transparency. Post-launch, these may
// diverge (separate pool, separate admin) — update both here and in the
// record-donation edge function if that happens.
export const ADMIN_WALLET = 'DdqT7Fek4FLNYcs9STT1Av1ZZgaXa6qNrTZso8USD3rk';
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

// Seeker Genesis Token (SGT) — Token-2022 non-transferable NFT.
// One per Solana Seeker device. Used for device-gated access.
// SGTs only exist on mainnet — always verify against mainnet RPC.
export const SGT_MINT_AUTHORITY =
  'GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4';
// SGT uses self-referencing metadata: the metadata pointer and group mint
// are both the same address. Verified against on-chain SGT mint account.
export const SGT_METADATA_ADDRESS =
  'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te';
export const SGT_GROUP_MINT_ADDRESS =
  'GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te';

// Mainnet RPC for SGT checks — used even in devnet builds.
export const MAINNET_RPC_URL = 'https://api.mainnet-beta.solana.com';
