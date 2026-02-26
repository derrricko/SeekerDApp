// v2 environment config — SOL donations only, no USDC/escrow
export const SOLANA_CLUSTER = 'devnet' as const;
export const RPC_URL = 'https://api.devnet.solana.com';

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

// Admin wallet (giveglimpse.skr)
export const ADMIN_WALLET = 'HQ5C58Tu11cy8Q8Lfjpj8sRTW25wY7VnwgoW61cfMsY5';
