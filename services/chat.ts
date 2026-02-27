// v2 chat service — Supabase Realtime subscriptions + message CRUD

import {useEffect, useRef, useState} from 'react';
import {getSupabase} from './supabase';
import {decodeBase64} from '../utils/base64';

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
  amount_sol?: number;
  amount_usdc?: number;
  recipient_id?: string;
}

// ---------- Fetch conversations ----------

export async function fetchConversations(
  walletAddress: string,
): Promise<Conversation[]> {
  const supabase = getSupabase();
  const {data, error} = await supabase
    .from('conversations')
    .select('*, donations(amount_sol, amount_usdc, recipient_id)')
    .or(`donor_wallet.eq.${walletAddress},admin_wallet.eq.${walletAddress}`)
    .order('created_at', {ascending: false});

  if (error) {
    throw error;
  }
  return (data || []).map(c => ({
    ...c,
    amount_sol: c.donations?.amount_sol,
    amount_usdc: c.donations?.amount_usdc,
    recipient_id: c.donations?.recipient_id,
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

  const {data: urlData} = supabase.storage
    .from('chat-media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
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
