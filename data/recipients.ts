// Hardcoded recipient list for v2 hackathon demo
// Move to Supabase table post-hackathon

export interface Recipient {
  id: string;
  name: string;
  wallet: string;
  description: string;
  category: string;
}

export const RECIPIENTS: Recipient[] = [
  {
    id: 'maria-car',
    name: 'Maria',
    wallet: '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
    description: 'Single mom needs tires replaced to get to work safely.',
    category: 'Transportation',
  },
  {
    id: 'evan-beheard',
    name: 'BeHeard Movement',
    wallet: '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
    description: 'Youth mentorship program in Tulsa. Every dollar goes to the kids.',
    category: 'Youth',
  },
  {
    id: 'jasmine-brakes',
    name: 'Jasmine',
    wallet: '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
    description: 'Needs brake repair — currently unsafe to drive her children to school.',
    category: 'Transportation',
  },
  {
    id: 'open-fund',
    name: 'Glimpse Open Fund',
    wallet: '4vGRAMXyq5jWEahxewLCJrpumx8q1Sxbwer6MhTmoR2T',
    description: 'General fund — we direct your SOL to the most urgent need.',
    category: 'General',
  },
];
