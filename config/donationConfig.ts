import {MATCHING_POOL_WALLET} from '../config/env';

export type DonationCadence = 'one_time' | 'daily';
export type DonationMode = 'solo' | 'group';
export type DonationStatus = 'confirmed' | 'completed';

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  confirmed: 'CONFIRMED',
  completed: 'COMPLETED',
};

export type NeedStatus =
  | 'open'
  | 'funded'
  | 'under_review'
  | 'purchased'
  | 'delivered'
  | 'classroom_photo_added'
  | 'failed';

export const NEED_STATUS_LABELS: Record<NeedStatus, string> = {
  open: 'OPEN',
  funded: 'FUNDED',
  under_review: 'UNDER REVIEW',
  purchased: 'PURCHASED',
  delivered: 'DELIVERED',
  classroom_photo_added: 'CLASSROOM PHOTO ADDED',
  failed: 'ISSUE',
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
  id: 'glimpse-wallet',
  name: 'Glimpse',
  wallet: MATCHING_POOL_WALLET,
  description:
    'Your USDC donation is received by Glimpse. Cause selections help us understand how to put your donation to work.',
};

// SYNC: campaign rules must match CAMPAIGN_RULES in supabase/functions/record-donation/index.ts
export const CAMPAIGN_OPTIONS: CampaignOption[] = [
  {
    id: 'public-schools',
    label: 'Public Schools',
    glimpseTag: '#001',
    summary:
      'Funds classroom supplies, equipment, maintenance, transportation, and other school needs that keep students and families supported.',
    causePreferences: ['education', 'public-schools'],
    minimumUSDC: 25,
  },
  {
    id: 'single-moms-crisis',
    label: "Single Mom's / Families in Crisis",
    glimpseTag: '#002',
    summary:
      'Supports families facing immediate hardship with essentials like diapers, formula, tire replacement, groceries, and critical household stability.',
    causePreferences: ['family-crisis', 'single-moms'],
    minimumUSDC: 50,
  },
  {
    id: 'foster-care-after-school',
    label: 'Foster Care / After School Programs',
    glimpseTag: '#003',
    summary:
      'Supports children in foster care and after-school programs with clothing, shoes, school items, and everyday essentials that help them feel prepared, included, and supported.',
    causePreferences: ['foster-care', 'child-essentials', 'after-school'],
    minimumUSDC: 100,
  },
  // NOTE: 'classroom-needs' is intentionally NOT in this array.
  // Classroom needs are funded via route-driven need mode (Milestone 2),
  // not the generic campaign dropdown. Server-side CAMPAIGN_RULES in
  // record-donation/index.ts has the rule for validation.
];

const NAME_BY_RECIPIENT_ID: Record<string, string> = {
  ...Object.fromEntries(CAMPAIGN_OPTIONS.map(c => [c.id, c.label])),
  general: 'General Donation',
};
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
