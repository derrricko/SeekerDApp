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

create or replace function public.current_wallet()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'wallet'
$$;

drop policy if exists "Donors can read their donations" on public.donations;
drop policy if exists "Service role can insert donations" on public.donations;
create policy "Donors can read their donations"
  on public.donations for select
  using (
    auth.role() = 'service_role'
    or donor_wallet = public.current_wallet()
    or recipient_wallet = public.current_wallet()
  );
create policy "Service role can insert donations"
  on public.donations for insert
  with check (auth.role() = 'service_role');

drop policy if exists "Participants can read conversations" on public.conversations;
drop policy if exists "Service role can insert conversations" on public.conversations;
create policy "Participants can read conversations"
  on public.conversations for select
  using (
    auth.role() = 'service_role'
    or donor_wallet = public.current_wallet()
    or admin_wallet = public.current_wallet()
  );
create policy "Service role can insert conversations"
  on public.conversations for insert
  with check (auth.role() = 'service_role');

drop policy if exists "Participants can read messages" on public.messages;
drop policy if exists "Participants can insert messages" on public.messages;
create policy "Participants can read messages"
  on public.messages for select
  using (
    auth.role() = 'service_role'
    or exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (
          c.donor_wallet = public.current_wallet()
          or c.admin_wallet = public.current_wallet()
        )
    )
  );
create policy "Participants can insert messages"
  on public.messages for insert
  with check (
    auth.role() = 'service_role'
    or (
      sender_wallet = public.current_wallet()
      and exists (
        select 1
        from public.conversations c
        where c.id = messages.conversation_id
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================

-- Enable realtime for messages table (used by useChatMessages hook)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;

-- ============================================================
-- STORAGE
-- ============================================================

-- Create chat-media bucket for photo/video/receipt uploads
insert into storage.buckets (id, name, public)
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

drop policy if exists "Participants can upload chat media" on storage.objects;
drop policy if exists "Participants can read chat media" on storage.objects;
create policy "Participants can upload chat media"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-media'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1
        from public.conversations c
        where c.id::text = split_part(name, '/', 1)
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

create policy "Participants can read chat media"
  on storage.objects for select
  using (
    bucket_id = 'chat-media'
    and (
      auth.role() = 'service_role'
      or exists (
        select 1
        from public.conversations c
        where c.id::text = split_part(name, '/', 1)
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  );
