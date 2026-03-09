// Classroom Needs service — fetch public need data from Supabase
//
// Reads go through security-definer RPC functions that return only
// donor-visible columns. Private fields (teacher_identity_key,
// funded_by_wallet, donor_note, source_url, source_asin) never
// leave the server.

import {getSupabase} from './supabase';
import type {NeedStatus} from '../config/donationConfig';

/** Public-facing need shape — only donor-visible fields */
export interface ClassroomNeed {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  price_usdc: number;
  teacher_first_name: string;
  school_name: string;
  school_city: string | null;
  school_state: string | null;
  status: NeedStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all classroom needs via security-definer function.
 * Returns only donor-visible columns, sorted: open first, then by created_at desc.
 */
export async function fetchClassroomNeeds(): Promise<ClassroomNeed[]> {
  const {data, error} = await getSupabase().rpc('get_classroom_needs_public');

  if (error) {
    console.error('[classroomNeeds] fetch error:', error);
    return [];
  }

  return (data as ClassroomNeed[]) || [];
}

/**
 * Fetch a single classroom need by ID via security-definer function.
 */
export async function fetchClassroomNeedById(
  id: string,
): Promise<ClassroomNeed | null> {
  const {data, error} = await getSupabase().rpc('get_classroom_need_by_id', {
    p_id: id,
  });

  if (error) {
    console.error('[classroomNeeds] fetchById error:', error);
    return null;
  }

  // RPC returns an array; we want the first (and only) row
  const rows = data as ClassroomNeed[] | null;
  return rows && rows.length > 0 ? rows[0] : null;
}

/** Helper: group needs by feed section */
export function groupNeedsBySection(needs: ClassroomNeed[]) {
  const open: ClassroomNeed[] = [];
  const inMotion: ClassroomNeed[] = [];
  const delivered: ClassroomNeed[] = [];

  for (const need of needs) {
    switch (need.status) {
      case 'open':
        open.push(need);
        break;
      case 'funded':
      case 'under_review':
      case 'purchased':
        inMotion.push(need);
        break;
      case 'delivered':
      case 'classroom_photo_added':
        delivered.push(need);
        break;
      case 'failed':
        // Failed needs don't show in feed for now
        break;
    }
  }

  return {open, inMotion, delivered};
}
