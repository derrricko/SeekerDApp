-- Track per-wallet conversation read markers so unread counts can be computed
-- server-side without exposing other participants' state.

create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  wallet text not null,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, wallet)
);

create index if not exists idx_conversation_reads_wallet
  on public.conversation_reads(wallet);

create index if not exists idx_conversation_reads_last_read_at
  on public.conversation_reads(last_read_at);

alter table public.conversation_reads enable row level security;

drop policy if exists "Participants can read their conversation reads" on public.conversation_reads;
drop policy if exists "Participants can insert their conversation reads" on public.conversation_reads;
drop policy if exists "Participants can update their conversation reads" on public.conversation_reads;

create policy "Participants can read their conversation reads"
  on public.conversation_reads for select
  using (
    auth.role() = 'service_role'
    or (
      wallet = public.current_wallet()
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_reads.conversation_id
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

create policy "Participants can insert their conversation reads"
  on public.conversation_reads for insert
  with check (
    auth.role() = 'service_role'
    or (
      wallet = public.current_wallet()
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_reads.conversation_id
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

create policy "Participants can update their conversation reads"
  on public.conversation_reads for update
  using (
    auth.role() = 'service_role'
    or (
      wallet = public.current_wallet()
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_reads.conversation_id
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  )
  with check (
    auth.role() = 'service_role'
    or (
      wallet = public.current_wallet()
      and exists (
        select 1
        from public.conversations c
        where c.id = conversation_reads.conversation_id
          and (
            c.donor_wallet = public.current_wallet()
            or c.admin_wallet = public.current_wallet()
          )
      )
    )
  );

create or replace function public.get_unread_counts(
  p_wallet text,
  p_conversation_ids uuid[] default null
)
returns table (
  conversation_id uuid,
  unread_count bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  with wallet_ctx as (
    select
      case
        when auth.role() = 'service_role' and p_wallet is not null and p_wallet <> '' then p_wallet
        else public.current_wallet()
      end as wallet
  ),
  my_conversations as (
    select c.id, wc.wallet
    from public.conversations c
    cross join wallet_ctx wc
    where wc.wallet is not null
      and (c.donor_wallet = wc.wallet or c.admin_wallet = wc.wallet)
      and (p_conversation_ids is null or c.id = any(p_conversation_ids))
  ),
  last_reads as (
    select cr.conversation_id, cr.last_read_at
    from public.conversation_reads cr
    cross join wallet_ctx wc
    where cr.wallet = wc.wallet
  )
  select
    mc.id as conversation_id,
    coalesce(count(m.id), 0)::bigint as unread_count
  from my_conversations mc
  left join last_reads lr
    on lr.conversation_id = mc.id
  left join public.messages m
    on m.conversation_id = mc.id
    and m.sender_wallet <> mc.wallet
    and m.created_at > coalesce(lr.last_read_at, to_timestamp(0))
  group by mc.id;
$$;

grant execute on function public.get_unread_counts(text, uuid[]) to authenticated, service_role;
