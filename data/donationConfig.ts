import {MATCHING_POOL_WALLET} from '../config/env';

export type DonationCadence = 'one_time' | 'daily';
export type DonationMode = 'solo' | 'group';

export interface CauseOption {
  id: string;
  label: string;
}

export const MATCHING_POOL = {
  id: 'matching-pool',
  name: 'Glimpse Matching Pool',
  wallet: MATCHING_POOL_WALLET,
  description:
    'Your USDC goes into the matching pool. Cause selections help us match you to the right need.',
};

export const CAUSE_OPTIONS: CauseOption[] = [
  {id: 'transportation', label: 'Transportation'},
  {id: 'housing', label: 'Housing'},
  {id: 'food', label: 'Food access'},
  {id: 'medical', label: 'Medical bills'},
  {id: 'childcare', label: 'Childcare'},
  {id: 'education', label: 'Education'},
];

const NAME_BY_RECIPIENT_ID: Record<string, string> = {
  'matching-pool': MATCHING_POOL.name,
};

export function getRecipientLabel(recipientId?: string | null): string {
  if (!recipientId) {
    return 'Donation Thread';
  }
  return NAME_BY_RECIPIENT_ID[recipientId] || 'Donation Thread';
}
