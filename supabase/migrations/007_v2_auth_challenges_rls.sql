-- Lock down auth_challenges table.
-- Only service_role (edge functions) should read/write this table.
-- Without RLS, any authenticated user could delete rows and replay auth messages.

alter table public.auth_challenges enable row level security;

-- No policies = deny all for anon and authenticated roles.
-- service_role bypasses RLS by default.
