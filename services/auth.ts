import {SUPABASE_ANON_KEY, SUPABASE_URL} from '../config/env';

export interface WalletAuthResponse {
  token: string;
  wallet: string;
  expires_at: number;
}

export function createWalletAuthMessage(now = Date.now()): string {
  return `glimpse-auth:${now}`;
}

export async function authenticateWalletSignature(params: {
  wallet: string;
  signature: string;
  message: string;
}): Promise<WalletAuthResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/wallet-auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params),
  });

  const payload = await safeParseJson(response);
  if (!response.ok) {
    const serverError =
      typeof payload?.error === 'string' ? payload.error : null;
    const detail = serverError || JSON.stringify(payload) || '(empty body)';
    console.error(`[wallet-auth] HTTP ${response.status}: ${detail}`);
    throw new Error(
      serverError || `Wallet auth failed (HTTP ${response.status})`,
    );
  }

  if (
    typeof payload?.token !== 'string' ||
    typeof payload?.wallet !== 'string' ||
    typeof payload?.expires_at !== 'number'
  ) {
    throw new Error('Wallet authentication returned an invalid response');
  }

  return payload as WalletAuthResponse;
}

async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
