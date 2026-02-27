-- v2 hardening patch for existing deployments.
-- Replaces permissive policies with wallet-scoped access and service-role writes.

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

drop policy if exists "Anyone can insert donations" on public.donations;
drop policy if exists "Participants can read donations" on public.donations;
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

drop policy if exists "Anyone can insert conversations" on public.conversations;
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

drop policy if exists "Anyone can insert messages" on public.messages;
drop policy if exists "Anyone can read messages" on public.messages;
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

drop policy if exists "Anyone can upload chat media" on storage.objects;
drop policy if exists "Anyone can read chat media" on storage.objects;
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
