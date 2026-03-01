import {createClient, SupabaseClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '../config/env';

let client: SupabaseClient | null = null;
let accessToken: string | null = null;

const AUTH_TOKEN_KEY = '@glimpse_wallet_jwt';

function createSupabaseClient(token: string | null): SupabaseClient {
  const next = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: token ? {Authorization: `Bearer ${token}`} : {},
    },
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  if (token) {
    next.realtime.setAuth(token);
  }

  return next;
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient(accessToken);
  }
  return client;
}

export function getSupabaseAccessToken(): string | null {
  return accessToken;
}

export async function hydrateSupabaseAccessToken(): Promise<void> {
  const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (storedToken && !isTokenExpired(storedToken)) {
    await setSupabaseAccessToken(storedToken);
  } else if (storedToken) {
    // Expired token — remove from storage so we don't try again
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/** Decode JWT payload and check exp claim without crypto. */
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payload));
    return (
      typeof decoded.exp !== 'number' ||
      decoded.exp <= Math.floor(Date.now() / 1000)
    );
  } catch {
    return true;
  }
}

export async function setSupabaseAccessToken(
  token: string | null,
): Promise<void> {
  accessToken = token;

  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  }

  client = createSupabaseClient(accessToken);
}
