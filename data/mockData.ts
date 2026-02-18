/**
 * Mock data for demo-ready visual skeleton.
 * All data is fake — no on-chain calls, no Supabase.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VaultRecipient {
  name: string;
  wallet: string;
  allocationBps: number; // basis points (e.g. 4000 = 40%)
  distributed: number; // micro-USDC
}

export interface Vault {
  id: string;
  name: string;
  description: string;
  slug: string;
  target: number; // micro-USDC
  totalDeposited: number; // micro-USDC
  depositorCount: number;
  recipients: VaultRecipient[];
  createdBy: string;
}

export interface CommunityEntry {
  initials: string;
  displayName: string;
  impactDescription: string;
  totalGiven: number; // micro-USDC
  currentStreak: number;
  circleId?: string;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  totalGives: number;
  streakAtRisk: boolean;
  lastGiveDate: string;
}

export interface AutoGiveConfig {
  reserveBalance: number; // micro-USDC
  amountPerTrigger: number; // micro-USDC
  totalAutoGiven: number; // micro-USDC
  triggerCount: number;
  vaultSlug: string;
}

export interface Circle {
  id: string;
  name: string;
  members: string[]; // display names
  monthlyGoal: number; // micro-USDC
  currentMonthTotal: number; // micro-USDC
  inviteCode: string;
}

export interface ActivityEntry {
  id: string;
  description: string;
  timeAgo: string;
  accentIndex: number; // 0=terracotta, 1=teal, 2=gold
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert micro-USDC (6 decimals) to "$X.XX" display string */
export function formatUSDC(amount: number): string {
  const dollars = amount / 1_000_000;
  if (dollars >= 1000) {
    return `$${dollars.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
  }
  if (Number.isInteger(dollars)) {
    return `$${dollars}`;
  }
  return `$${dollars.toFixed(2)}`;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

export const MOCK_VAULTS: Vault[] = [
  {
    id: 'vault-1',
    name: 'SLC Community Support',
    description:
      'Three families in Salt Lake City identified by local church partners. Each family is facing a different crisis — but all of them need the same thing: someone to notice.',
    slug: 'slc-community',
    target: 2500_000_000, // $2,500
    totalDeposited: 1847_000_000, // $1,847
    depositorCount: 23,
    recipients: [
      {
        name: 'Maria & family',
        wallet: '7xK...m3Q',
        allocationBps: 4000,
        distributed: 738_800_000,
      },
      {
        name: 'DeShawn',
        wallet: '4pR...n8W',
        allocationBps: 3500,
        distributed: 646_450_000,
      },
      {
        name: 'Linda R.',
        wallet: '9mJ...k2P',
        allocationBps: 2500,
        distributed: 461_750_000,
      },
    ],
    createdBy: 'Glimpse Team',
  },
  {
    id: 'vault-2',
    name: 'Clean Water Initiative',
    description:
      'Two communities in rural Guatemala still draw water from a contaminated stream. A $3,000 well serves 200 people for 20 years. The math is simple — the impact is generational.',
    slug: 'clean-water',
    target: 3000_000_000, // $3,000
    totalDeposited: 1220_000_000, // $1,220
    depositorCount: 14,
    recipients: [
      {
        name: 'Aldea Esperanza',
        wallet: '3kL...p7Y',
        allocationBps: 6000,
        distributed: 732_000_000,
      },
      {
        name: 'Aldea Nuevo Sol',
        wallet: '8wN...j4R',
        allocationBps: 4000,
        distributed: 488_000_000,
      },
    ],
    createdBy: 'Glimpse Team',
  },
  {
    id: 'vault-3',
    name: 'Education Fund',
    description:
      'Three high school seniors in Muscatine who got accepted to college but can\'t afford the gap between financial aid and tuition. The difference between going and not going is about $1,200 each.',
    slug: 'education-fund',
    target: 3600_000_000, // $3,600
    totalDeposited: 890_000_000, // $890
    depositorCount: 9,
    recipients: [
      {
        name: 'Jaylen T.',
        wallet: '2bF...m9K',
        allocationBps: 3500,
        distributed: 311_500_000,
      },
      {
        name: 'Priya S.',
        wallet: '6nC...w3L',
        allocationBps: 3500,
        distributed: 311_500_000,
      },
      {
        name: 'Miguel A.',
        wallet: '1hR...v6J',
        allocationBps: 3000,
        distributed: 267_000_000,
      },
    ],
    createdBy: 'Glimpse Team',
  },
];

export const MOCK_COMMUNITY: CommunityEntry[] = [
  {
    initials: 'SM',
    displayName: 'Sarah M.',
    impactDescription: 'Funded groceries for a single mom',
    totalGiven: 4_200_000_000,
    currentStreak: 34,
    circleId: 'circle-1',
  },
  {
    initials: 'ED',
    displayName: 'Evan D.',
    impactDescription: 'Covered rent for a family facing eviction',
    totalGiven: 3_800_000_000,
    currentStreak: 28,
    circleId: 'circle-1',
  },
  {
    initials: 'PJ',
    displayName: 'Pastor Jim',
    impactDescription: 'Bought new tires for a mom of three',
    totalGiven: 2_900_000_000,
    currentStreak: 45,
    circleId: 'circle-1',
  },
  {
    initials: 'DW',
    displayName: 'Derrick W.',
    impactDescription: 'Funded clean water for a village',
    totalGiven: 1_247_000_000,
    currentStreak: 12,
    circleId: 'circle-1',
  },
  {
    initials: 'KC',
    displayName: 'Katie C.',
    impactDescription: 'Sent a foster kid to summer camp',
    totalGiven: 980_000_000,
    currentStreak: 8,
    circleId: 'circle-1',
  },
  {
    initials: 'RM',
    displayName: 'Roberto M.',
    impactDescription: 'Covered school supplies for 12 kids',
    totalGiven: 870_000_000,
    currentStreak: 15,
  },
  {
    initials: 'TL',
    displayName: 'Tina L.',
    impactDescription: 'Paid a medical bill for an uninsured neighbor',
    totalGiven: 750_000_000,
    currentStreak: 6,
    circleId: 'circle-1',
  },
  {
    initials: 'AJ',
    displayName: 'Andre J.',
    impactDescription: 'Funded showers for 30 people at BeHeard',
    totalGiven: 620_000_000,
    currentStreak: 19,
  },
  {
    initials: 'LH',
    displayName: 'Lisa H.',
    impactDescription: 'Bought a wardrobe for a foster child',
    totalGiven: 510_000_000,
    currentStreak: 11,
  },
  {
    initials: 'BT',
    displayName: 'Ben T.',
    impactDescription: 'Covered gas for a job-seeker for a month',
    totalGiven: 340_000_000,
    currentStreak: 4,
  },
];

export const MOCK_USER_STREAK: UserStreak = {
  currentStreak: 12,
  longestStreak: 23,
  totalGives: 47,
  streakAtRisk: false,
  lastGiveDate: '2026-02-17',
};

export const MOCK_AUTO_GIVE: AutoGiveConfig = {
  reserveBalance: 5_000_000, // $5.00
  amountPerTrigger: 1_000_000, // $1.00
  totalAutoGiven: 15_000_000, // $15.00
  triggerCount: 15,
  vaultSlug: 'slc-community',
};

export const MOCK_CIRCLE: Circle = {
  id: 'circle-1',
  name: 'Midwest Givers',
  members: [
    'Sarah M.',
    'Evan D.',
    'Pastor Jim',
    'Derrick W.',
    'Katie C.',
    'Tina L.',
    'Roberto M.',
  ],
  monthlyGoal: 50_000_000, // $50
  currentMonthTotal: 32_000_000, // $32
  inviteCode: 'MIDWEST-2026',
};

export const MOCK_ACTIVITY: ActivityEntry[] = [
  {
    id: 'act-1',
    description: 'Funded groceries for Marcus',
    timeAgo: '2h ago',
    accentIndex: 0,
  },
  {
    id: 'act-2',
    description: 'Clean water well reached 40% funded',
    timeAgo: '5h ago',
    accentIndex: 1,
  },
  {
    id: 'act-3',
    description: 'Jaylen T. accepted to Iowa State',
    timeAgo: '1d ago',
    accentIndex: 2,
  },
  {
    id: 'act-4',
    description: 'New tires installed for Rosa',
    timeAgo: '2d ago',
    accentIndex: 0,
  },
  {
    id: 'act-5',
    description: 'Midwest Givers hit $32 this month',
    timeAgo: '3d ago',
    accentIndex: 2,
  },
];

export const MOCK_VAULT_HISTORY = [
  {id: 'vh-1', description: 'Sarah M. deposited $25', timeAgo: '3h ago', accentIndex: 0},
  {id: 'vh-2', description: 'Evan D. deposited $50', timeAgo: '1d ago', accentIndex: 1},
  {id: 'vh-3', description: 'Pastor Jim deposited $100', timeAgo: '2d ago', accentIndex: 2},
  {id: 'vh-4', description: 'Katie C. deposited $10', timeAgo: '4d ago', accentIndex: 0},
];

/** Total given across all community members (micro-USDC) */
export const MOCK_COLLECTIVE_TOTAL = MOCK_COMMUNITY.reduce(
  (sum, e) => sum + e.totalGiven,
  0,
);

/** Accent colors array accessor for cycling */
export const ACCENT_COLORS = ['primary', 'accent', 'secondary'] as const;
