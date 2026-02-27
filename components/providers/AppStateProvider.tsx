import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type DonationCadence = 'one_time' | 'daily';
export type LeaderboardScope = 'campaign' | 'all_time';

export interface CampaignMilestone {
  id: string;
  dateRange: string;
  title: string;
  description: string;
  active?: boolean;
}

export interface GlimpseCard {
  id: string;
  tag: string;
  title: string;
  visibility: 'Public' | 'Private';
  dateLabel: string;
  status: 'Active' | 'Fulfilled';
  raised: number;
}

export interface FeedPost {
  id: string;
  campaign: string;
  title: string;
  body: string;
  timestampLabel: string;
  mediaType?: 'image' | 'video';
}

export interface LeaderboardEntry {
  id: string;
  displayName: string;
  campaignScore: number;
  allTimeScore: number;
  totalDonated: number;
  streakDays: number;
  badge?: string;
  isYou?: boolean;
}

export interface DonationReceipt {
  receiptId: string;
  amount: number;
  cadence: DonationCadence;
  weightedPoints: number;
  timestamp: string;
}

interface AppStateContextValue {
  campaignTitle: string;
  campaignLocation: string;
  campaignDescription: string;
  runningTally: number;
  donorCount: number;
  glimpses: GlimpseCard[];
  timeline: CampaignMilestone[];
  updates: FeedPost[];
  leaderboard: LeaderboardEntry[];
  currentUser: LeaderboardEntry;
  submitDonation: (args: {
    amount: number;
    cadence: DonationCadence;
  }) => Promise<DonationReceipt>;
}

const STARTING_TALLY = 150;
const STARTING_DONORS = 24;
const USER_ID = 'you';

const INITIAL_GLIMPSES: GlimpseCard[] = [
  {
    id: 'g-001',
    tag: 'GLIMPSE #001',
    title: '#001',
    visibility: 'Public',
    dateLabel: 'Oct 24',
    status: 'Fulfilled',
    raised: 150,
  },
  {
    id: 'g-002',
    tag: 'GLIMPSE #002',
    title: '#002',
    visibility: 'Private',
    dateLabel: 'Sep 12',
    status: 'Active',
    raised: 50,
  },
];

const INITIAL_TIMELINE: CampaignMilestone[] = [
  {
    id: 'm1',
    dateRange: 'Feb 24 - Mar 31, 2026',
    title: 'Campaign 01: Single Family Car Repair Fund',
    description:
      'Active campaign focused on urgent tires, brakes, and safety repairs.',
    active: true,
  },
  {
    id: 'm2',
    dateRange: 'Apr 1 - May 31, 2026',
    title: 'Campaign 02: Partner Campaign',
    description:
      'TBD with partners. Details announced after campaign 01 closes.',
  },
  {
    id: 'm3',
    dateRange: 'Jun 1, 2026',
    title: 'Airdrop Snapshot',
    description:
      'Final activity snapshot. Consistency and streaks increase weighting.',
  },
];

const INITIAL_UPDATES: FeedPost[] = [
  {
    id: 'u1',
    campaign: 'Single Family Car Repair Fund',
    title: 'Repair approved with local shop',
    body: 'Quote verified and parts ordered. Installation is scheduled this week.',
    timestampLabel: '2h ago',
    mediaType: 'image',
  },
  {
    id: 'u2',
    campaign: 'Single Family Car Repair Fund',
    title: 'Family reached safe transportation',
    body: 'Emergency brake line replacement completed. School and work transport restored.',
    timestampLabel: 'Yesterday',
  },
  {
    id: 'u3',
    campaign: 'Single Family Car Repair Fund',
    title: 'Partner intake complete',
    body: 'New referrals entered for next review cycle. Priority is safety-critical repairs.',
    timestampLabel: '2d ago',
    mediaType: 'video',
  },
];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'd1',
    displayName: 'MIA...4KT',
    campaignScore: 96.4,
    allTimeScore: 143.9,
    totalDonated: 84,
    streakDays: 21,
    badge: 'Consistent',
  },
  {
    id: 'd2',
    displayName: 'ELI...92Q',
    campaignScore: 84.2,
    allTimeScore: 122.6,
    totalDonated: 73,
    streakDays: 14,
    badge: 'Builder',
  },
  {
    id: 'd3',
    displayName: 'AVA...XK1',
    campaignScore: 71.8,
    allTimeScore: 105.7,
    totalDonated: 64,
    streakDays: 10,
  },
  {
    id: USER_ID,
    displayName: 'YOU...NOW',
    campaignScore: 0,
    allTimeScore: 0,
    totalDonated: 0,
    streakDays: 0,
    isYou: true,
  },
];

const AppStateContext = createContext<AppStateContextValue | null>(null);

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function wait(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

export function AppStateProvider({children}: {children: React.ReactNode}) {
  const [runningTally, setRunningTally] = useState<number>(STARTING_TALLY);
  const [donorCount, setDonorCount] = useState<number>(STARTING_DONORS);
  const [glimpses, setGlimpses] = useState<GlimpseCard[]>(INITIAL_GLIMPSES);
  const [updates, setUpdates] = useState<FeedPost[]>(INITIAL_UPDATES);
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);

  const submitDonation = useCallback(
    async ({amount, cadence}: {amount: number; cadence: DonationCadence}) => {
      await wait(450);

      const normalizedAmount = round(Math.max(amount, 0));

      let receipt: DonationReceipt = {
        receiptId: '',
        amount: normalizedAmount,
        cadence,
        weightedPoints: 0,
        timestamp: new Date().toISOString(),
      };

      setLeaderboard(current => {
        const now = new Date();
        const next = [...current];
        const userIndex = next.findIndex(entry => entry.id === USER_ID);
        const currentUser =
          userIndex >= 0 ? next[userIndex] : INITIAL_LEADERBOARD[3];

        const nextStreak =
          cadence === 'daily'
            ? currentUser.streakDays + 1
            : currentUser.streakDays;
        const cadenceMultiplier = cadence === 'daily' ? 1.28 : 1;
        const streakMultiplier = 1 + Math.min(nextStreak, 30) * 0.015;
        const weightedPoints = round(
          normalizedAmount * cadenceMultiplier * streakMultiplier,
        );

        const updatedUser: LeaderboardEntry = {
          ...currentUser,
          totalDonated: round(currentUser.totalDonated + normalizedAmount),
          campaignScore: round(currentUser.campaignScore + weightedPoints),
          allTimeScore: round(currentUser.allTimeScore + weightedPoints),
          streakDays: nextStreak,
          badge: nextStreak >= 7 ? 'Consistent' : currentUser.badge,
          isYou: true,
        };

        if (userIndex >= 0) {
          next[userIndex] = updatedUser;
        } else {
          next.push(updatedUser);
        }

        const isFirstDonation = currentUser.totalDonated === 0;
        if (isFirstDonation) {
          setDonorCount(prev => prev + 1);
        }

        setRunningTally(prev => {
          const nextTally = round(prev + normalizedAmount);
          setGlimpses(currentGlimpses =>
            currentGlimpses.map((item, idx) =>
              idx === 0 ? {...item, raised: nextTally} : item,
            ),
          );
          return nextTally;
        });

        const receiptId = `GL-${now.getFullYear()}${String(
          now.getMonth() + 1,
        ).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now
          .getTime()
          .toString()
          .slice(-5)}`;

        const updatePost: FeedPost = {
          id: `u-${now.getTime()}`,
          campaign: 'Single Family Car Repair Fund',
          title:
            cadence === 'daily'
              ? 'New daily commitment added'
              : 'New one-time contribution received',
          body:
            cadence === 'daily'
              ? `A ${normalizedAmount} SOL daily commitment was recorded. Streak weighting increased impact score.`
              : `A ${normalizedAmount} SOL one-time contribution was recorded and added to the campaign tally.`,
          timestampLabel: 'Just now',
        };

        setUpdates(currentUpdates => [updatePost, ...currentUpdates]);

        receipt = {
          receiptId,
          amount: normalizedAmount,
          cadence,
          weightedPoints,
          timestamp: now.toISOString(),
        };

        return next;
      });

      return receipt;
    },
    [],
  );

  const currentUser = useMemo(() => {
    return (
      leaderboard.find(entry => entry.id === USER_ID) ?? INITIAL_LEADERBOARD[3]
    );
  }, [leaderboard]);

  const value = useMemo(
    () => ({
      campaignTitle: 'Single Moms Car Relief',
      campaignLocation: 'Active in local community',
      campaignDescription: 'Community giving pool with documented outcomes.',
      runningTally,
      donorCount,
      glimpses,
      timeline: INITIAL_TIMELINE,
      updates,
      leaderboard,
      currentUser,
      submitDonation,
    }),
    [
      runningTally,
      donorCount,
      glimpses,
      updates,
      leaderboard,
      currentUser,
      submitDonation,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
