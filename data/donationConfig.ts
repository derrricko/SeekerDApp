import {MATCHING_POOL_WALLET} from '../config/env';

export type DonationCadence = 'one_time' | 'daily';
export type DonationMode = 'solo' | 'group';
export type DonationStatus = 'confirmed' | 'completed';

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  confirmed: 'CONFIRMED',
  completed: 'COMPLETED',
};

export interface CampaignOption {
  id: string;
  label: string;
  glimpseTag: string;
  summary: string;
  causePreferences: string[];
  minimumUSDC: number;
}

export const MATCHING_POOL = {
  id: 'matching-pool',
  name: 'Glimpse Matching Pool',
  wallet: MATCHING_POOL_WALLET,
  description:
    'Your USDC goes into the matching pool. Cause selections help us match you to the right need.',
};

// SYNC: campaign rules must match CAMPAIGN_RULES in supabase/functions/record-donation/index.ts
export const CAMPAIGN_OPTIONS: CampaignOption[] = [
  {
    id: 'teacher-supplies',
    label: 'Supplies for public school teachers',
    glimpseTag: '#001',
    summary:
      'Funds urgent classroom supplies like notebooks, markers, books, and project materials so teachers can keep students equipped without paying out of pocket.',
    causePreferences: ['education', 'teacher-supplies'],
    minimumUSDC: 1,
  },
  {
    id: 'single-moms-crisis',
    label: 'Support for single moms and families in crisis',
    glimpseTag: '#002',
    summary:
      'Supports families facing immediate hardship with essentials like transportation, groceries, and critical household stability during emergency periods.',
    causePreferences: ['family-crisis', 'single-moms'],
    minimumUSDC: 2,
  },
  {
    id: 'foster-care-after-school',
    label: 'Foster care after school programs, diapers and formula',
    glimpseTag: '#003',
    summary:
      'Helps foster and vulnerable children access after-school programs while covering essentials like diapers and formula for younger kids in care.',
    causePreferences: ['foster-care', 'child-essentials', 'after-school'],
    minimumUSDC: 3,
  },
];

const NAME_BY_RECIPIENT_ID: Record<string, string> = Object.fromEntries(
  CAMPAIGN_OPTIONS.map(c => [c.id, c.label]),
);
const GLIMPSE_BY_RECIPIENT_ID: Record<string, string> = Object.fromEntries(
  CAMPAIGN_OPTIONS.map(c => [c.id, c.glimpseTag]),
);

export function getRecipientLabel(recipientId?: string | null): string {
  if (!recipientId) {
    return 'Donation Thread';
  }
  return NAME_BY_RECIPIENT_ID[recipientId] || 'Donation Thread';
}

export function getRecipientGlimpseTag(recipientId?: string | null): string {
  if (!recipientId) {
    return '#000';
  }
  return GLIMPSE_BY_RECIPIENT_ID[recipientId] || '#000';
}
