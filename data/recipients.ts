// Backward-compat recipient mapping.
// Keep only matching pool while donation routing is centralized.

export interface Recipient {
  id: string;
  name: string;
  wallet: string;
  description: string;
  category: string;
}

export const RECIPIENTS: Recipient[] = [
  {
    id: 'matching-pool',
    name: 'Glimpse Matching Pool',
    wallet: '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
    description:
      'Your USDC is routed into the matching pool, then assigned to the right need.',
    category: 'General',
  },
];
