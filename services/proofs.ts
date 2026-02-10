/**
 * Proof media service — fetches documented impact for fulfilled needs.
 */

import {supabase} from './supabase';
import {SUPABASE_URL} from '../config/env';

export interface Proof {
  id: string;
  need_id: string;
  media_url: string;
  media_type: 'image' | 'video' | 'receipt';
  caption: string | null;
  created_at: string;
}

/**
 * Fetch proof media for a given need.
 */
export async function fetchProofsForNeed(needId: string): Promise<Proof[]> {
  if (!SUPABASE_URL) {
    return [];
  }

  try {
    const {data, error} = await supabase
      .from('proofs')
      .select('*')
      .eq('need_id', needId)
      .order('created_at', {ascending: false});

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}
