// AsyncStorage retry queue for orphaned donations
// If Supabase insert fails after a confirmed on-chain tx,
// we store the pending operation and retry on next app open.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {DonationMode} from '../config/donationConfig';

const RETRY_KEY = '@glimpse_pending_conversations';

export interface PendingConversation {
  txSignature: string;
  donorWallet: string;
  recipientId: string;
  amountUSDC: number;
  causePreferences: string[];
  donationMode: DonationMode;
  timestamp: number;
}

export async function addPendingConversation(
  pending: PendingConversation,
): Promise<void> {
  const existing = await getPendingConversations();
  // Deduplicate by txSignature — prevent double-queue from retries or double-taps
  if (existing.some(p => p.txSignature === pending.txSignature)) {
    return;
  }
  existing.push(pending);
  await AsyncStorage.setItem(RETRY_KEY, JSON.stringify(existing));
}

export async function getPendingConversations(): Promise<
  PendingConversation[]
> {
  const raw = await AsyncStorage.getItem(RETRY_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function removePendingConversation(
  txSignature: string,
): Promise<void> {
  const existing = await getPendingConversations();
  const filtered = existing.filter(p => p.txSignature !== txSignature);
  await AsyncStorage.setItem(RETRY_KEY, JSON.stringify(filtered));
}
