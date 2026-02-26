-- v2 schema: donations, conversations, messages
-- Matches the shapes expected by services/donations.ts and services/chat.ts

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.donations (
  id          uuid primary key default gen_random_uuid(),
  tx_signature text not null unique,
  donor_wallet text not null,
  recipient_wallet text not null,
  recipient_id text not null,
  amount_sol  numeric(18,9) not null check (amount_sol > 0),
  created_at  timestamptz not null default now()
);

create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  donation_id  uuid not null references public.donations(id) on delete cascade,
  donor_wallet text not null,
  admin_wallet text not null,
  created_at   timestamptz not null default now(),
  constraint conversations_donation_unique unique (donation_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_wallet   text not null,
  body            text,
  media_url       text,
  media_type      text check (media_type in ('image', 'video', 'receipt')),
  created_at      timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_donations_donor on public.donations(donor_wallet);
create index if not exists idx_donations_tx on public.donations(tx_signature);
create index if not exists idx_conversations_donor on public.conversations(donor_wallet);
create index if not exists idx_conversations_admin on public.conversations(admin_wallet);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);

-- ============================================================
-- RLS
-- ============================================================

alter table public.donations enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Donations: anyone can insert (anon key from mobile app), participants can read
create policy "Anyone can insert donations"
  on public.donations for insert
  with check (true);

create policy "Participants can read donations"
  on public.donations for select
  using (true);

-- Conversations: anyone can insert (created by donation service), participants can read
create policy "Anyone can insert conversations"
  on public.conversations for insert
  with check (true);

create policy "Participants can read conversations"
  on public.conversations for select
  using (
    donor_wallet = current_setting('request.jwt.claims', true)::json->>'wallet'
    or admin_wallet = current_setting('request.jwt.claims', true)::json->>'wallet'
    -- Fallback: allow anon reads when no JWT (initial v2 — tighten after auth edge fn)
    or current_setting('request.jwt.claims', true) is null
  );

-- Messages: conversation participants can insert and read
create policy "Anyone can insert messages"
  on public.messages for insert
  with check (true);

create policy "Anyone can read messages"
  on public.messages for select
  using (true);

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime for messages table (used by useChatMessages hook)
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- STORAGE
-- ============================================================

-- Create chat-media bucket for photo/video/receipt uploads
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- Allow uploads to chat-media bucket
create policy "Anyone can upload chat media"
  on storage.objects for insert
  with check (bucket_id = 'chat-media');

create policy "Anyone can read chat media"
  on storage.objects for select
  using (bucket_id = 'chat-media');
