// v2 chat service — Supabase Realtime subscriptions + message CRUD

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {getSupabase} from './supabase';
import {decodeBase64} from '../utils/base64';
import type {DonationStatus} from '../data/donationConfig';

// ---------- Types ----------

export interface Message {
  id: string;
  conversation_id: string;
  sender_wallet: string;
  body: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'receipt' | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  donation_id: string;
  donor_wallet: string;
  admin_wallet: string;
  created_at: string;
  // Joined from donations table
  amount_usdc?: number;
  recipient_id?: string;
  tx_signature?: string;
  unread_count?: number;
  donation_status?: DonationStatus;
}

export interface DonationHistoryItem {
  id: string;
  amount_usdc: number;
  recipient_id: string;
  created_at: string;
  status: DonationStatus;
  tx_signature: string;
  donation_mode: string;
  cadence: string;
  conversation_id: string | null;
  donor_wallet?: string;
}

// ---------- Fetch conversations ----------

export async function fetchConversations(
  walletAddress: string,
): Promise<Conversation[]> {
  const supabase = getSupabase();
  const {data, error} = await supabase
    .from('conversations')
    .select('*, donations(amount_usdc, recipient_id, tx_signature, status)')
    .or(`donor_wallet.eq.${walletAddress},admin_wallet.eq.${walletAddress}`)
    .order('created_at', {ascending: false});

  if (error) {
    throw error;
  }

  const conversations = (data || []).map(c => ({
    ...c,
    amount_usdc: c.donations?.amount_usdc,
    recipient_id: c.donations?.recipient_id,
    tx_signature: c.donations?.tx_signature,
    donation_status: (c.donations?.status || 'confirmed') as DonationStatus,
  }));

  const conversationIds = conversations.map(c => c.id);
  const unreadCounts = await fetchUnreadCounts(walletAddress, conversationIds);

  return conversations.map(conversation => ({
    ...conversation,
    unread_count: unreadCounts[conversation.id] ?? 0,
  }));
}

// ---------- Fetch messages ----------

export async function fetchMessages(
  conversationId: string,
): Promise<Message[]> {
  const supabase = getSupabase();
  const {data, error} = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', {ascending: true});

  if (error) {
    throw error;
  }
  return data || [];
}

// ---------- Send message ----------

export async function sendMessage(
  conversationId: string,
  senderWallet: string,
  body?: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video' | 'receipt',
): Promise<Message> {
  if (mediaUrl) {
    // Only store internal storage paths (e.g. "<conversationId>/<file>").
    // Reject absolute URLs so chat cannot be used as an external link/embed vector.
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(mediaUrl)) {
      throw new Error('External media URLs are not allowed');
    }
    if (!mediaUrl.startsWith(`${conversationId}/`)) {
      throw new Error('Media path must be scoped to this conversation');
    }
  }

  const supabase = getSupabase();
  const {data, error} = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_wallet: senderWallet,
      body: body || null,
      media_url: mediaUrl || null,
      media_type: mediaType || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

// ---------- Read markers + unread counts ----------

interface UnreadCountsRow {
  conversation_id: string;
  unread_count: number;
}

interface DonationWithConversation {
  id: string;
}

interface DonationHistoryRow {
  id: string;
  amount_usdc: number | string | null;
  recipient_id: string | null;
  created_at: string;
  status: string | null;
  tx_signature: string | null;
  donation_mode: string | null;
  cadence: string | null;
  donor_wallet?: string | null;
  conversations?: DonationWithConversation | DonationWithConversation[] | null;
}

async function fetchUnreadCounts(
  walletAddress: string,
  conversationIds?: string[],
): Promise<Record<string, number>> {
  if (conversationIds?.length === 0) {
    return {};
  }

  const supabase = getSupabase();
  const {data, error} = await supabase.rpc('get_unread_counts', {
    p_wallet: walletAddress,
    p_conversation_ids: conversationIds ?? null,
  });

  if (error) {
    // Keep conversations usable even if unread metadata fails.
    return {};
  }

  const rows = (data ?? []) as UnreadCountsRow[];
  const unreadByConversation: Record<string, number> = {};
  for (const row of rows) {
    unreadByConversation[row.conversation_id] = Number(row.unread_count) || 0;
  }
  return unreadByConversation;
}

export async function markConversationRead(
  conversationId: string,
  walletAddress: string,
): Promise<void> {
  const supabase = getSupabase();
  const {error} = await supabase.from('conversation_reads').upsert(
    {
      conversation_id: conversationId,
      wallet: walletAddress,
      last_read_at: new Date().toISOString(),
    },
    {
      onConflict: 'conversation_id,wallet',
    },
  );

  if (error) {
    throw error;
  }
}

function mapDonationRow(row: DonationHistoryRow): DonationHistoryItem {
  const conversationJoin = Array.isArray(row.conversations)
    ? row.conversations[0]
    : row.conversations;
  return {
    id: row.id,
    amount_usdc: Number(row.amount_usdc) || 0,
    recipient_id: row.recipient_id || 'unknown',
    created_at: row.created_at,
    status: (row.status || 'confirmed') as DonationStatus,
    tx_signature: row.tx_signature || '',
    donation_mode: row.donation_mode || 'solo',
    cadence: row.cadence || 'one_time',
    conversation_id: conversationJoin?.id ?? null,
    donor_wallet: row.donor_wallet ?? undefined,
  };
}

async function queryDonations(opts: {
  walletAddress?: string;
  limit?: number;
}): Promise<DonationHistoryItem[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('donations')
    .select(
      'id, amount_usdc, donor_wallet, recipient_id, created_at, status, tx_signature, donation_mode, cadence, conversations(id)',
    )
    .order('created_at', {ascending: false});

  if (opts.walletAddress) {
    query = query.eq('donor_wallet', opts.walletAddress);
  }
  if (opts.limit) {
    query = query.limit(opts.limit);
  }

  const {data, error} = await query;
  if (error) {
    throw error;
  }

  return (data ?? [] as DonationHistoryRow[]).map(mapDonationRow);
}

export function fetchDonationHistory(
  walletAddress: string,
): Promise<DonationHistoryItem[]> {
  return queryDonations({walletAddress});
}

export function fetchAllDonations(
  limit = 50,
): Promise<DonationHistoryItem[]> {
  return queryDonations({limit});
}

export function useUnreadCount(walletAddress: string | null) {
  const [conversationUnreads, setConversationUnreads] = useState<
    Record<string, number>
  >({});
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const activeConversationRef = useRef<string | null>(null);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  const refresh = useCallback(async () => {
    if (!walletAddress) {
      setConversationUnreads({});
      return;
    }
    const unreadMap = await fetchUnreadCounts(walletAddress);
    setConversationUnreads(unreadMap);
  }, [walletAddress]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const markRead = useCallback(
    async (conversationId: string) => {
      if (!walletAddress) {
        return;
      }
      await markConversationRead(conversationId, walletAddress);
      setConversationUnreads(prev => {
        if ((prev[conversationId] ?? 0) === 0) {
          return prev;
        }
        return {...prev, [conversationId]: 0};
      });
    },
    [walletAddress],
  );

  const setActiveConversation = useCallback(
    (conversationId: string | null) => {
      setActiveConversationId(conversationId);
      if (conversationId) {
        markRead(conversationId).catch(() => {});
      }
    },
    [markRead],
  );

  useEffect(() => {
    if (!walletAddress) {
      return;
    }

    const supabase = getSupabase();
    const channel = supabase
      .channel(`messages-unread:${walletAddress}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        payload => {
          const message = payload.new as {
            conversation_id?: string;
            sender_wallet?: string;
          };
          const conversationId = message.conversation_id;
          if (!conversationId || message.sender_wallet === walletAddress) {
            return;
          }

          if (activeConversationRef.current === conversationId) {
            markRead(conversationId).catch(() => {});
            return;
          }

          setConversationUnreads(prev => ({
            ...prev,
            [conversationId]: (prev[conversationId] ?? 0) + 1,
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [markRead, walletAddress]);

  const totalUnread = useMemo(
    () =>
      Object.values(conversationUnreads).reduce(
        (sum, count) => sum + Math.max(0, count),
        0,
      ),
    [conversationUnreads],
  );

  return {
    totalUnread,
    conversationUnreads,
    activeConversationId,
    markRead,
    refresh,
    setActiveConversation,
  };
}

// ---------- Upload media ----------

export async function uploadChatMedia(
  conversationId: string,
  fileName: string,
  fileBase64: string,
  contentType: string,
): Promise<string> {
  const supabase = getSupabase();
  const filePath = `${conversationId}/${Date.now()}-${fileName}`;

  const bytes = decodeBase64(fileBase64);
  const {data, error} = await supabase.storage
    .from('chat-media')
    .upload(filePath, bytes.buffer as ArrayBuffer, {contentType});

  if (error) {
    throw error;
  }

  return data.path;
}

// ---------- Resolve media URL ----------

/** Create a fresh signed URL for a stored file path. Call at render time. */
export async function getMediaSignedUrl(filePath: string): Promise<string> {
  const supabase = getSupabase();
  const {data, error} = await supabase.storage
    .from('chat-media')
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    throw error || new Error('Failed to create signed URL');
  }
  return data.signedUrl;
}

// ---------- useChatMessages hook ----------

/** Insert a message into a sorted array, deduplicating by id */
function insertSorted(prev: Message[], msg: Message): Message[] {
  // Deduplicate: if message already exists, skip
  if (prev.some(m => m.id === msg.id)) {
    return prev;
  }

  // Binary-search insert position by created_at for correct ordering
  const ts = msg.created_at;
  let lo = 0;
  let hi = prev.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (prev[mid].created_at <= ts) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  const next = [...prev];
  next.splice(lo, 0, msg);
  return next;
}

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Single effect: subscribe first, then fetch, to avoid missing messages
  // in the gap between fetch-complete and subscribe-active.
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMessages([]);

    const supabase = getSupabase();

    // 1. Subscribe to realtime FIRST so no messages are missed
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        payload => {
          if (!cancelled) {
            const msg = payload.new as Message;
            setMessages(prev => insertSorted(prev, msg));
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    // 2. Then fetch existing messages — merge with any that arrived via realtime
    fetchMessages(conversationId)
      .then(msgs => {
        if (!cancelled) {
          setMessages(prev => {
            // Merge fetched messages with any realtime messages already received
            const merged = [...msgs];
            for (const rt of prev) {
              if (!merged.some(m => m.id === rt.id)) {
                merged.push(rt);
              }
            }
            merged.sort((a, b) => a.created_at.localeCompare(b.created_at));
            return merged;
          });
          setLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId]);

  return {messages, loading, error};
}
