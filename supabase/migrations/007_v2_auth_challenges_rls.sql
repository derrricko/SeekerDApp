-- Ensure auth_challenges table exists (may have been dropped or never created)
-- then lock it down with RLS so only service_role (edge functions) can access.

create table if not exists public.auth_challenges (
  message text primary key,
  wallet text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_challenges_created_at
  on public.auth_challenges(created_at);

alter table public.auth_challenges enable row level security;

-- No policies = deny all for anon and authenticated roles.
-- service_role bypasses RLS by default.
