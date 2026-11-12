-- ORBI app schema. Run once in the Supabase SQL editor, after waitlist.sql.
--
-- The privacy rules live here, not in the UI:
--   * a plan is visible only to its host and the host's accepted connections
--   * nobody sees who hosts or who else said yes; people see counts only
--   * names open up at start time, only to the people in the plan, and only
--     if the plan reached 3 (the host plus 2)
--   * a plan that doesn't reach 3 by start time quietly disappears for everyone

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 40),
  invite_code text not null unique default lower(encode(gen_random_bytes(6), 'hex')),
  created_at timestamptz not null default now()
);

create table if not exists public.connections (
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('dinner', 'brunch', 'run', 'workout', 'painting', 'sauna', 'gallery', 'show', 'bar', 'drinks', 'networking', 'study', 'sport', 'class', 'other')),
  place text not null check (char_length(btrim(place)) between 1 and 80),
  note text check (note is null or char_length(note) <= 280),
  starts_at timestamptz not null,
  -- spots for mutuals (the host is not counted)
  open_spots int not null,
  -- friends the host is already bringing, who are not on orbi
  bringing int not null default 0,
  created_at timestamptz not null default now()
);

-- group size rules, written so this file can run again on an existing project:
-- the host + the friends they bring + the open spots must be 3 or more
alter table public.plans add column if not exists bringing int not null default 0;
alter table public.plans drop constraint if exists plans_open_spots_check;
alter table public.plans drop constraint if exists plans_bringing_check;
alter table public.plans drop constraint if exists plans_min_group;
alter table public.plans add constraint plans_open_spots_check check (open_spots between 1 and 11);
alter table public.plans add constraint plans_bringing_check check (bringing between 0 and 10);
alter table public.plans add constraint plans_min_group check (1 + bringing + open_spots >= 3);

-- networking plans carry a field (finance, consulting...); kept in sync with lib/app/kinds.ts
alter table public.plans add column if not exists topic text;
alter table public.plans drop constraint if exists plans_kind_check;
alter table public.plans add constraint plans_kind_check check (kind in ('dinner', 'brunch', 'run', 'workout', 'painting', 'sauna', 'gallery', 'show', 'bar', 'drinks', 'networking', 'study', 'sport', 'class', 'other'));
alter table public.plans drop constraint if exists plans_topic_check;
alter table public.plans add constraint plans_topic_check check (topic is null or (kind = 'networking' and topic in ('finance', 'consulting', 'tech', 'startups', 'marketing', 'law', 'health', 'creative', 'policy', 'school')));
-- plans made from a link (a tiktok or reel), with a place on the map and a minimum to happen.
-- share_slug is the public link: /p/<slug>. it shows a teaser only, never the host unless show_host.
alter table public.plans add column if not exists title text;
alter table public.plans add column if not exists share_slug text not null default substr(md5(gen_random_uuid()::text), 1, 10);
alter table public.plans add column if not exists source_url text;
alter table public.plans add column if not exists source_author text;
alter table public.plans add column if not exists thumbnail_url text;
alter table public.plans add column if not exists lat double precision;
alter table public.plans add column if not exists lng double precision;
alter table public.plans add column if not exists neighborhood text;
alter table public.plans add column if not exists price_level int;
alter table public.plans add column if not exists cost_note text;
alter table public.plans add column if not exists min_people int not null default 3;
alter table public.plans add column if not exists show_host boolean not null default false;
alter table public.plans drop constraint if exists plans_link_fields;
alter table public.plans add constraint plans_link_fields check (
  (title is null or char_length(btrim(title)) between 1 and 80)
  and (source_url is null or (char_length(source_url) <= 500 and source_url ~ '^https://'))
  and (source_author is null or char_length(source_author) <= 60)
  and (thumbnail_url is null or (char_length(thumbnail_url) <= 1000 and thumbnail_url ~ '^https://'))
  and (neighborhood is null or char_length(neighborhood) <= 40)
  and (cost_note is null or char_length(cost_note) <= 80)
  and (price_level is null or price_level between 0 and 3)
  and ((lat is null) = (lng is null))
  and (lat is null or (lat between -90 and 90 and lng between -180 and 180))
);
alter table public.plans drop constraint if exists plans_min_people;
-- the minimum counts everyone, host included, and can't be more than the group can hold
alter table public.plans add constraint plans_min_people check (min_people between 3 and 12 and min_people <= 1 + bringing + open_spots);
create unique index if not exists plans_share_slug_idx on public.plans (share_slug);
create index if not exists plans_host_idx on public.plans (host_id);
create index if not exists plans_starts_idx on public.plans (starts_at);

create table if not exists public.rsvps (
  plan_id uuid not null references public.plans (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, user_id)
);
create index if not exists rsvps_user_idx on public.rsvps (user_id);

create table if not exists public.plan_photos (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  path text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers

create or replace function public.are_connected(x uuid, y uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from connections
    where user_a = least(x, y) and user_b = greatest(x, y)
  );
$$;

create or replace function public.plan_taken(p uuid)
returns int
language sql stable security definer set search_path = public
as $$
  select count(*)::int from rsvps where plan_id = p;
$$;

-- people in the plan besides the host: mutuals who said yes + friends the host brings
create or replace function public.plan_count(p uuid)
returns int
language sql stable security definer set search_path = public
as $$
  select plan_taken(p) + coalesce((select bringing from plans where id = p), 0);
$$;

-- host or confirmed guest
create or replace function public.is_in_plan(p uuid, u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from plans where id = p and host_id = u)
      or exists (select 1 from rsvps where plan_id = p and user_id = u);
$$;

-- has the plan started? (the plans table itself is host-only, so policies use this)
create or replace function public.plan_started(p uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from plans where id = p and starts_at <= now());
$$;

-- friends x and y have in common (internal, not callable by the app)
create or replace function public.mutual_count(x uuid, y uuid)
returns int
language sql stable security definer set search_path = public
as $$
  with nx as (select case when user_a = x then user_b else user_a end as id from connections where x in (user_a, user_b)),
       ny as (select case when user_a = y then user_b else user_a end as id from connections where y in (user_a, user_b))
  select count(*)::int from nx join ny using (id);
$$;

create or replace function public.mutual_band(n numeric)
returns text
language sql immutable
as $$
  select case
    when n is null or n < 1 then null
    when n >= 40 then '40+'
    when n >= 20 then '20+'
    when n >= 10 then '10+'
    when n >= 5 then '5+'
    else 'a few'
  end;
$$;

-- open: still filling, not yet 3 · on: 3+ and not started · live: started, within 6h
-- past: on and over · off: start time passed without reaching 3 (never shown)
create or replace function public.plan_status(starts timestamptz, taken int)
returns text
language sql stable
as $$
  select case
    when now() < starts and taken < 2 then 'open'
    when now() < starts then 'on'
    when taken < 2 then 'off'
    when now() < starts + interval '6 hours' then 'live'
    else 'past'
  end;
$$;

-- the same, with the plan's own minimum (everyone counted, host included)
create or replace function public.plan_status(starts timestamptz, taken int, min_people int)
returns text
language sql stable
as $$
  select case
    when now() < starts and taken + 1 < min_people then 'open'
    when now() < starts then 'on'
    when taken + 1 < min_people then 'off'
    when now() < starts + interval '6 hours' then 'live'
    else 'past'
  end;
$$;

-- ---------------------------------------------------------------- row level security

alter table public.profiles enable row level security;
alter table public.connections enable row level security;
alter table public.plans enable row level security;
alter table public.rsvps enable row level security;
alter table public.plan_photos enable row level security;

-- profiles: yourself and your connections (connections already know each other)
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.are_connected(id, auth.uid()));
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- connections: read your own; created only through accept_invite()
drop policy if exists connections_select on public.connections;
create policy connections_select on public.connections for select to authenticated
  using (auth.uid() in (user_a, user_b));

-- plans: only the host can read the row directly (it holds host_id).
-- everyone else reads plans through my_plans(), which never returns the host.
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select to authenticated
  using (host_id = auth.uid());
drop policy if exists plans_insert on public.plans;
create policy plans_insert on public.plans for insert to authenticated
  with check (host_id = auth.uid() and starts_at > now());
drop policy if exists plans_delete on public.plans;
create policy plans_delete on public.plans for delete to authenticated
  using (host_id = auth.uid() and starts_at > now());

-- rsvps: you can see only your own; created through join_plan()
drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps for select to authenticated
  using (user_id = auth.uid());

-- photos: people in the plan, once it has started
drop policy if exists photos_select on public.plan_photos;
create policy photos_select on public.plan_photos for select to authenticated
  using (public.is_in_plan(plan_id, auth.uid()));
drop policy if exists photos_insert on public.plan_photos;
create policy photos_insert on public.plan_photos for insert to authenticated
  with check (
    uploaded_by = auth.uid()
    and public.is_in_plan(plan_id, auth.uid())
    and public.plan_started(plan_id)
  );

revoke all on public.profiles, public.connections, public.plans, public.rsvps, public.plan_photos from anon;
grant select, insert, update on public.profiles to authenticated;
grant select on public.connections to authenticated;
grant select, insert, delete on public.plans to authenticated;
grant select on public.rsvps to authenticated;
grant select, insert on public.plan_photos to authenticated;

-- ---------------------------------------------------------------- functions the app calls

-- every plan you can see: yours, your connections', and ones you joined.
-- never returns host_id. plans that didn't reach 3 are dropped.
drop function if exists public.my_plans();
create function public.my_plans()
returns table (
  id uuid, kind text, place text, note text, starts_at timestamptz,
  open_spots int, taken int, bringing int, topic text, is_host boolean, joined boolean, status text,
  title text, share_slug text, source_url text, source_author text, thumbnail_url text,
  lat double precision, lng double precision, neighborhood text, price_level int, cost_note text,
  min_people int, show_host boolean
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.kind, p.place, p.note, p.starts_at, p.open_spots,
         plan_taken(p.id) as taken,
         p.bringing,
         p.topic,
         p.host_id = auth.uid() as is_host,
         exists (select 1 from rsvps r where r.plan_id = p.id and r.user_id = auth.uid()) as joined,
         plan_status(p.starts_at, plan_count(p.id), p.min_people) as status,
         p.title, p.share_slug, p.source_url, p.source_author, p.thumbnail_url,
         p.lat, p.lng, p.neighborhood, p.price_level, p.cost_note, p.min_people, p.show_host
  from plans p
  where auth.uid() is not null
    and (
      p.host_id = auth.uid()
      or exists (select 1 from rsvps r where r.plan_id = p.id and r.user_id = auth.uid())
      or (are_connected(p.host_id, auth.uid()) and p.starts_at > now())
    )
    and plan_status(p.starts_at, plan_count(p.id), p.min_people) <> 'off'
  order by p.starts_at;
$$;

create or replace function public.join_plan(p uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  pl plans%rowtype;
begin
  if me is null then raise exception 'not signed in'; end if;
  select * into pl from plans where id = p for update;
  if not found then raise exception 'plan not found'; end if;
  if pl.host_id = me then raise exception 'you are hosting this plan'; end if;
  if not are_connected(pl.host_id, me) then raise exception 'plan not found'; end if;
  if pl.starts_at <= now() then raise exception 'this plan has started'; end if;
  if exists (select 1 from rsvps where plan_id = p and user_id = me) then return 'joined'; end if;
  if plan_taken(p) >= pl.open_spots then raise exception 'this plan is full'; end if;
  insert into rsvps (plan_id, user_id) values (p, me);
  return 'joined';
end;
$$;

create or replace function public.leave_plan(p uuid)
returns void
language sql security definer set search_path = public
as $$
  delete from rsvps
  where plan_id = p and user_id = auth.uid()
    and exists (select 1 from plans where id = p and starts_at > now());
$$;

-- the reveal: names, only for people in the plan, only from start time, only if it reached 3
-- the reveal: names, only for people in the plan, only from start time, only if it reached 3
drop function if exists public.plan_people(uuid);
create function public.plan_people(p uuid)
returns table (user_id uuid, first_name text, is_host boolean, is_me boolean)
language sql stable security definer set search_path = public
as $$
  with pl as (select * from plans where id = p)
  select pr.id, pr.first_name, pr.id = pl.host_id, pr.id = auth.uid()
  from pl
  join profiles pr on pr.id = pl.host_id or pr.id in (select user_id from rsvps where plan_id = p)
  where is_in_plan(p, auth.uid())
    and pl.starts_at <= now()
    and plan_count(p) + 1 >= pl.min_people
  order by (pr.id = pl.host_id) desc, pr.first_name;
$$;

-- the icebreaker at the reveal: one exact number for the whole group, never per person.
-- how many different people in your network are friends with at least one other person in the plan.
create or replace function public.plan_group_mutuals(p uuid)
returns int
language sql stable security definer set search_path = public
as $$
  with pl as (select * from plans where id = p),
  members as (
    select host_id as id from pl
    union select user_id from rsvps where plan_id = p
  ),
  others as (select id from members where id <> auth.uid()),
  my_friends as (
    select case when user_a = auth.uid() then user_b else user_a end as id
    from connections where auth.uid() in (user_a, user_b)
  ),
  their_friends as (
    select case when c.user_a = o.id then c.user_b else c.user_a end as id
    from connections c join others o on o.id in (c.user_a, c.user_b)
  )
  select count(distinct f.id)::int
  from my_friends f
  join their_friends t on t.id = f.id
  where f.id not in (select id from members)
    and is_in_plan(p, auth.uid())
    and (select starts_at from pl) <= now()
    and plan_count(p) + 1 >= (select min_people from pl);
$$;

-- ---------------------------------------------------------------- keep in orbit
-- After a plan starts, each person can quietly pick who they want to keep in their orbit.
-- Two people who pick each other become connected. A one-sided pick stays private forever.
create table if not exists public.orbit_picks (
  plan_id uuid not null references public.plans (id) on delete cascade,
  picker uuid not null references public.profiles (id) on delete cascade,
  picked uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (plan_id, picker, picked),
  check (picker <> picked)
);
alter table public.orbit_picks enable row level security;
drop policy if exists orbit_picks_select on public.orbit_picks;
create policy orbit_picks_select on public.orbit_picks for select to authenticated
  using (picker = auth.uid());
revoke all on public.orbit_picks from anon;
grant select on public.orbit_picks to authenticated;

create or replace function public.keep_in_orbit(p uuid, target uuid)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not signed in'; end if;
  if target = me or not plan_started(p) or plan_count(p) < 2
     or not is_in_plan(p, me) or not is_in_plan(p, target) then
    raise exception 'plan not found';
  end if;
  if are_connected(me, target) then return 'connected'; end if;
  insert into orbit_picks (plan_id, picker, picked) values (p, me, target) on conflict do nothing;
  if exists (select 1 from orbit_picks where picker = target and picked = me) then
    insert into connections (user_a, user_b) values (least(me, target), greatest(me, target)) on conflict do nothing;
    return 'connected';
  end if;
  return 'picked';
end;
$$;

create or replace function public.drop_orbit_pick(p uuid, target uuid)
returns void
language sql security definer set search_path = public
as $$
  delete from orbit_picks where plan_id = p and picker = auth.uid() and picked = target;
$$;

-- ---------------------------------------------------------------- memories you add yourself
-- A memory from something that happened outside a plan. You can tag your connections,
-- but a tagged person only sees it after they accept. Declining is silent.
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('dinner', 'brunch', 'run', 'workout', 'painting', 'sauna', 'gallery', 'show', 'bar', 'drinks', 'networking', 'study', 'sport', 'class', 'other')),
  place text not null check (char_length(btrim(place)) between 1 and 80),
  happened_on date not null,
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now()
);

alter table public.memories drop constraint if exists memories_kind_check;
alter table public.memories add constraint memories_kind_check check (kind in ('dinner', 'brunch', 'run', 'workout', 'painting', 'sauna', 'gallery', 'show', 'bar', 'drinks', 'networking', 'study', 'sport', 'class', 'other'));

create table if not exists public.memory_people (
  memory_id uuid not null references public.memories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  primary key (memory_id, user_id)
);

create table if not exists public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  uploaded_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  path text not null unique,
  created_at timestamptz not null default now()
);

-- creator, or someone who accepted
create or replace function public.can_see_memory(m uuid, u uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from memories where id = m and created_by = u)
      or exists (select 1 from memory_people where memory_id = m and user_id = u and status = 'accepted');
$$;

alter table public.memories enable row level security;
alter table public.memory_people enable row level security;
alter table public.memory_photos enable row level security;
-- everything goes through the functions below, except reading photo records
drop policy if exists memory_photos_select on public.memory_photos;
create policy memory_photos_select on public.memory_photos for select to authenticated
  using (public.can_see_memory(memory_id, auth.uid()));
drop policy if exists memory_photos_insert on public.memory_photos;
create policy memory_photos_insert on public.memory_photos for insert to authenticated
  with check (uploaded_by = auth.uid() and public.can_see_memory(memory_id, auth.uid()));
revoke all on public.memories, public.memory_people, public.memory_photos from anon;
grant select, insert on public.memory_photos to authenticated;

create or replace function public.add_memory(k text, place text, happened date, note text, tagged uuid[])
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  mid uuid;
  t uuid;
begin
  if me is null then raise exception 'not signed in'; end if;
  if happened > current_date then raise exception 'a memory is something that already happened'; end if;
  insert into memories (created_by, kind, place, happened_on, note)
  values (me, k, btrim(place), happened, nullif(btrim(note), '')) returning id into mid;
  foreach t in array coalesce(tagged, '{}') loop
    if t <> me and are_connected(me, t) then
      insert into memory_people (memory_id, user_id) values (mid, t) on conflict do nothing;
    end if;
  end loop;
  return mid;
end;
$$;

-- accept shows it to you; decline quietly removes you
create or replace function public.answer_memory(m uuid, accept boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if accept then
    update memory_people set status = 'accepted' where memory_id = m and user_id = auth.uid();
  else
    delete from memory_people where memory_id = m and user_id = auth.uid() and status = 'pending';
  end if;
end;
$$;

-- memories you can see, with only the names of people who accepted
create or replace function public.my_memories()
returns table (id uuid, kind text, place text, happened_on date, note text, is_mine boolean, with_names text[], waiting int)
language sql stable security definer set search_path = public
as $$
  select m.id, m.kind, m.place, m.happened_on, m.note, m.created_by = auth.uid(),
         array(
           select pr.first_name from profiles pr
           where (pr.id = m.created_by or pr.id in (select user_id from memory_people where memory_id = m.id and status = 'accepted'))
             and pr.id <> auth.uid()
           order by pr.first_name
         ),
         case when m.created_by = auth.uid()
              then (select count(*)::int from memory_people where memory_id = m.id and status = 'pending')
              else 0 end
  from memories m
  where can_see_memory(m.id, auth.uid())
  order by m.happened_on desc;
$$;

-- memories someone tagged you in, waiting for your answer
create or replace function public.memory_invites()
returns table (id uuid, kind text, place text, happened_on date, from_name text)
language sql stable security definer set search_path = public
as $$
  select m.id, m.kind, m.place, m.happened_on, pr.first_name
  from memory_people mp
  join memories m on m.id = mp.memory_id
  join profiles pr on pr.id = m.created_by
  where mp.user_id = auth.uid() and mp.status = 'pending'
  order by m.created_at desc;
$$;

-- one memory, for its page: visible if you can see it, or if you were tagged and haven't answered
create or replace function public.memory_detail(m uuid)
returns table (id uuid, kind text, place text, happened_on date, note text, is_mine boolean, with_names text[], waiting int, invited_by text)
language sql stable security definer set search_path = public
as $$
  select mm.id, mm.kind, mm.place, mm.happened_on, mm.note, mm.is_mine, mm.with_names, mm.waiting, null::text
  from my_memories() mm where mm.id = m
  union all
  select i.id, i.kind, i.place, i.happened_on, null, false, '{}'::text[], 0, i.from_name
  from memory_invites() i where i.id = m;
$$;

revoke all on function public.can_see_memory(uuid, uuid), public.add_memory(text, text, date, text, uuid[]),
  public.answer_memory(uuid, boolean), public.my_memories(), public.memory_invites(), public.memory_detail(uuid) from public, anon;
grant execute on function public.add_memory(text, text, date, text, uuid[]), public.answer_memory(uuid, boolean),
  public.my_memories(), public.memory_invites(), public.memory_detail(uuid), public.can_see_memory(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------- what you're into (private)
-- Used only to order the plans you already see. Never shown to anyone, never about people.
create table if not exists public.preferences (
  user_id uuid primary key default auth.uid() references public.profiles (id) on delete cascade,
  kinds text[] not null default '{}',
  times text[] not null default '{}',
  areas text[] not null default '{}',
  group_size text check (group_size is null or group_size in ('small', 'medium', 'big')),
  updated_at timestamptz not null default now(),
  check (cardinality(kinds) <= 14 and cardinality(times) <= 4 and cardinality(areas) <= 4)
);
alter table public.preferences add column if not exists topics text[] not null default '{}';
-- room for every plan type (lib/app/kinds.ts), on projects created before study, sport and class
alter table public.preferences drop constraint if exists preferences_check;
alter table public.preferences add constraint preferences_check check (cardinality(kinds) <= 14 and cardinality(times) <= 4 and cardinality(areas) <= 4);
alter table public.preferences enable row level security;
drop policy if exists preferences_own on public.preferences;
create policy preferences_own on public.preferences for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke all on public.preferences from anon;
grant select, insert, update on public.preferences to authenticated;

-- ---------------------------------------------------------------- trust signal, at group level only
-- Before the reveal people see a signal about the whole group, never about one person:
--   * everyone in a plan you can see is at most 2 steps from you (you, the host, them)
--   * the average number of friends you share with the others, as a coarse band
--   * the band only shows once there are 4 or more other people, so it can't point at anyone

create or replace function public.plan_signal(p uuid)
returns table (others int, band text)
language plpgsql stable security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  pl plans%rowtype;
  n int;
  avg_m numeric;
begin
  if me is null then return; end if;
  select * into pl from plans where id = p;
  if not found then return; end if;
  if not (pl.host_id = me or exists (select 1 from rsvps where plan_id = p and user_id = me) or are_connected(pl.host_id, me)) then
    return;
  end if;
  select count(*), avg(mutual_count(me, m.id)) into n, avg_m
  from (select pl.host_id as id union select user_id from rsvps where plan_id = p) m
  where m.id <> me;
  others := n;
  band := case when n >= 4 then mutual_band(avg_m) else null end;
  return next;
end;
$$;

create or replace function public.accept_invite(code text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  inviter profiles%rowtype;
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = me) then raise exception 'finish your profile first'; end if;
  select * into inviter from profiles where invite_code = lower(btrim(code));
  if not found then raise exception 'this invite link does not work'; end if;
  if inviter.id = me then return 'self'; end if;
  insert into connections (user_a, user_b)
  values (least(me, inviter.id), greatest(me, inviter.id))
  on conflict do nothing;
  return inviter.first_name;
end;
$$;

-- shown on the invite page before you accept
create or replace function public.invite_name(code text)
returns text
language sql stable security definer set search_path = public
as $$
  select first_name from profiles where invite_code = lower(btrim(code));
$$;

-- ---------------------------------------------------------------- the public plan link (/p/<slug>)
-- Anyone with the link sees a teaser: what, where, when and how many are in. Never who.
-- The host's first name only if they chose to show it.
drop function if exists public.plan_teaser(text);
create function public.plan_teaser(slug text)
returns table (
  title text, kind text, topic text, place text, neighborhood text, note text, starts_at timestamptz,
  lat double precision, lng double precision, thumbnail_url text, source_author text,
  price_level int, cost_note text, going int, min_people int, max_people int, status text,
  host_name text, is_host boolean, joined boolean, connected boolean
)
language sql stable security definer set search_path = public
as $$
  select p.title, p.kind, p.topic, p.place, p.neighborhood, p.note, p.starts_at,
         p.lat, p.lng, p.thumbnail_url, p.source_author,
         p.price_level, p.cost_note,
         1 + plan_count(p.id) as going,
         p.min_people,
         1 + p.bringing + p.open_spots as max_people,
         plan_status(p.starts_at, plan_count(p.id), p.min_people) as status,
         case when p.show_host then (select first_name from profiles where id = p.host_id) end as host_name,
         coalesce(p.host_id = auth.uid(), false) as is_host,
         coalesce(exists (select 1 from rsvps r where r.plan_id = p.id and r.user_id = auth.uid()), false) as joined,
         coalesce(auth.uid() is not null and are_connected(p.host_id, auth.uid()), false) as connected
  from plans p
  where p.share_slug = btrim(slug)
    and plan_status(p.starts_at, plan_count(p.id), p.min_people) in ('open', 'on', 'live');
$$;

-- Saying "i'm in" from the link: the link works as the host's invite.
-- You connect with the host (you'll see each other's plans), then you join. Mutuals only, still.
create or replace function public.join_via_link(slug text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  pl plans%rowtype;
begin
  if me is null then raise exception 'not signed in'; end if;
  if not exists (select 1 from profiles where id = me) then raise exception 'finish your profile first'; end if;
  select * into pl from plans where share_slug = btrim(slug);
  if not found then raise exception 'plan not found'; end if;
  if pl.host_id = me then raise exception 'you are hosting this plan'; end if;
  if pl.starts_at <= now() then raise exception 'this plan has started'; end if;
  insert into connections (user_a, user_b)
  values (least(me, pl.host_id), greatest(me, pl.host_id))
  on conflict do nothing;
  perform join_plan(pl.id);
  return pl.id;
end;
$$;

-- who you'd connect with by joining from a link (shown before you say yes). signed-in only.
create or replace function public.link_host_name(slug text)
returns text
language sql stable security definer set search_path = public
as $$
  select pr.first_name from plans p join profiles pr on pr.id = p.host_id
  where p.share_slug = btrim(slug) and auth.uid() is not null and p.starts_at > now();
$$;

revoke all on function public.plan_teaser(text), public.join_via_link(text), public.link_host_name(text),
  public.plan_status(timestamptz, int, int) from public;
grant execute on function public.plan_teaser(text) to anon, authenticated;
grant execute on function public.join_via_link(text), public.link_host_name(text) to authenticated;

revoke all on function public.mutual_count(uuid, uuid), public.plan_signal(uuid), public.plan_group_mutuals(uuid) from public, anon, authenticated;
grant execute on function public.plan_signal(uuid), public.plan_group_mutuals(uuid) to authenticated;
revoke all on function public.keep_in_orbit(uuid, uuid), public.drop_orbit_pick(uuid, uuid), public.plan_count(uuid) from public, anon;
grant execute on function public.keep_in_orbit(uuid, uuid), public.drop_orbit_pick(uuid, uuid) to authenticated;
revoke all on function public.my_plans(), public.join_plan(uuid), public.leave_plan(uuid),
  public.plan_people(uuid), public.accept_invite(text), public.invite_name(text),
  public.are_connected(uuid, uuid), public.plan_taken(uuid), public.is_in_plan(uuid, uuid),
  public.plan_started(uuid)
  from public, anon;
grant execute on function public.my_plans(), public.join_plan(uuid), public.leave_plan(uuid),
  public.plan_people(uuid), public.accept_invite(text), public.invite_name(text)
  to authenticated;

-- ---------------------------------------------------------------- photo storage
-- Private bucket; files live at <plan_id>/<file>. Only people in the plan,
-- once it has started, can upload or view.

insert into storage.buckets (id, name, public)
values ('plan-photos', 'plan-photos', false)
on conflict (id) do nothing;

drop policy if exists "plan photos read" on storage.objects;
create policy "plan photos read" on storage.objects for select to authenticated
  using (
    bucket_id = 'plan-photos'
    and public.is_in_plan(((storage.foldername(name))[1])::uuid, auth.uid())
  );

drop policy if exists "plan photos upload" on storage.objects;
create policy "plan photos upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'plan-photos'
    and public.is_in_plan(((storage.foldername(name))[1])::uuid, auth.uid())
    and public.plan_started(((storage.foldername(name))[1])::uuid)
  );

-- used inside the row level security policies above, so the signed-in role needs to call them
grant execute on function public.is_in_plan(uuid, uuid), public.are_connected(uuid, uuid), public.plan_started(uuid) to authenticated;

-- photos for memories you added: private bucket, files at <memory_id>/<file>
insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', false)
on conflict (id) do nothing;

drop policy if exists "memory photos read" on storage.objects;
create policy "memory photos read" on storage.objects for select to authenticated
  using (bucket_id = 'memory-photos' and public.can_see_memory(((storage.foldername(name))[1])::uuid, auth.uid()));

drop policy if exists "memory photos upload" on storage.objects;
create policy "memory photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'memory-photos' and public.can_see_memory(((storage.foldername(name))[1])::uuid, auth.uid()));
