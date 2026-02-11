/**
 * Profile service — fetch and update user profiles.
 */

import {getSupabase} from './supabase';
import {SUPABASE_URL} from '../config/env';

export interface Profile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Fetch a profile by wallet address.
 */
export async function fetchProfile(
  walletAddress: string,
): Promise<Profile | null> {
  if (!SUPABASE_URL) {
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  try {
    const {data, error} = await supabase
      .from('profiles')
      .select('id, wallet_address, display_name, avatar_url')
      .eq('wallet_address', walletAddress)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  walletAddress: string,
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>,
): Promise<Profile | null> {
  if (!SUPABASE_URL) {
    return null;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  try {
    const {data, error} = await supabase
      .from('profiles')
      .update(updates)
      .eq('wallet_address', walletAddress)
      .select('id, wallet_address, display_name, avatar_url')
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
