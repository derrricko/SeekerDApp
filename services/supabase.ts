/**
 * Supabase client singleton for React Native.
 * Uses a lazy getter to avoid crashing when env vars are empty.
 */

import {createClient, SupabaseClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config/env';

let _client: SupabaseClient | null = null;

/**
 * Returns the Supabase client, or null if URL/key are not configured.
 * Safe to call at module load time — no eager createClient('', '').
 */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null;
  }

  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage as any,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return _client;
}
