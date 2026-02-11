/**
 * Needs data service.
 * Fetches active needs from Supabase, falls back to static data.
 */

import {getSupabase} from './supabase';
import {NEEDS} from '../data/content';
import type {Need} from '../data/content';
import {SUPABASE_URL} from '../config/env';

export interface NeedRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  amount: number;
  funded: number;
  status: string;
  partner: string | null;
  icon: string | null;
}

/**
 * Map a Supabase row to the app's Need type.
 */
function rowToNeed(row: NeedRow): Need {
  return {
    id: row.slug,
    title: row.title,
    description: row.description,
    amount: row.amount,
    funded: row.funded,
    partner: row.partner ?? undefined,
    icon: row.icon ?? 'circle',
  };
}

/**
 * Fetch active needs from Supabase.
 * Falls back to static NEEDS array if Supabase is not configured or errors.
 */
export async function fetchActiveNeeds(): Promise<Need[]> {
  if (!SUPABASE_URL) {
    return NEEDS;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NEEDS;
  }

  try {
    const {data, error} = await supabase
      .from('needs')
      .select('*')
      .eq('status', 'active')
      .order('amount', {ascending: true});

    if (error || !data || data.length === 0) {
      return NEEDS;
    }

    return data.map(rowToNeed);
  } catch {
    return NEEDS;
  }
}
