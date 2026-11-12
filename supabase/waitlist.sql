-- ORBI waitlist. Run once in the Supabase SQL editor.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  first_name text not null,
  neighborhood text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_format check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' and char_length(email) <= 254),
  constraint waitlist_first_name_len check (char_length(first_name) between 1 and 60),
  constraint waitlist_neighborhood_len check (neighborhood is null or char_length(neighborhood) <= 80)
);

-- one row per email, case-insensitive
create unique index if not exists waitlist_email_unique on public.waitlist (lower(email));

-- row level security: anon may insert, and nothing else
alter table public.waitlist enable row level security;

drop policy if exists "anon can join the waitlist" on public.waitlist;
create policy "anon can join the waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- no select, update or delete policies exist, so anon cannot read or change the list.
revoke select, update, delete on public.waitlist from anon;
grant insert on public.waitlist to anon;
