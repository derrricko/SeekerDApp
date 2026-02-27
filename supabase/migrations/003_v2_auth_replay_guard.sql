-- Prevent wallet-auth challenge replay within the accepted timestamp window.

create table if not exists public.auth_challenges (
  message text primary key,
  wallet text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_challenges_created_at
  on public.auth_challenges(created_at);
