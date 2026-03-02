-- Drop v1 legacy tables not referenced by any v2 code or edge functions.
DROP TABLE IF EXISTS public.needs CASCADE;
DROP TABLE IF EXISTS public.nonces CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.proofs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
