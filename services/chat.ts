// v2 chat service — Supabase Realtime subscriptions + message CRUD

import {useCallback, useEffect, useRef, useState} from 'react';
import {getSupabase} from './supabase';

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
  recipient_id?: string;
}

// ---------- Fetch conversations ----------

export async function fetchConversations(
  walletAddress: string,
): Promise<Conversation[]> {
  const supabase = getSupabase();
  const {data, error} = await supabase
    .from('conversations')
    .select('*, donations(amount_sol, recipient_id)')
    .or(`donor_wallet.eq.${walletAddress},admin_wallet.eq.${walletAddress}`)
    .order('created_at', {ascending: false});

  if (error) throw error;
  return (data || []).map(c => ({
    ...c,
    amount_sol: c.donations?.amount_sol,
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

  if (error) throw error;
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

  if (error) throw error;
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

  const {data, error} = await supabase.storage
    .from('chat-media')
    .upload(filePath, decode(fileBase64), {contentType});

  if (error) throw error;

  const {data: urlData} = supabase.storage
    .from('chat-media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// base64 → Uint8Array
function decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// ---------- useChatMessages hook ----------

export function useChatMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  // Load initial messages
  useEffect(() => {
    if (!conversationId) return;

    setLoading(true);
    setError(null);

    fetchMessages(conversationId)
      .then(msgs => {
        setMessages(msgs);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [conversationId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const supabase = getSupabase();
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
          setMessages(prev => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId]);

  return {messages, loading, error};
}
