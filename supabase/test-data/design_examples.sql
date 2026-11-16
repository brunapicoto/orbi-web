-- Example people, plans and memories from the ORBI design, in your real app, so it looks alive
-- while you show it around. Run it in the Supabase SQL editor after app.sql.
--
-- * 20 example people (emails at example.com). They can't sign in: no password, no real inbox.
-- * They're in your orbit, and in the orbit of everyone already connected to you (your partner too,
--   if she has joined). Run this again after someone new joins and they'll see the examples too.
-- * Upcoming plans, one starting soon (so you can try the check-in), memories with ratings,
--   and a list of places for you.
-- * Running it again starts the examples over. To remove everything: remove_design_examples.sql.
--
-- If you signed in to the app with a different email, change it below.
do $$
declare
  me uuid;
  ppl text[] := array['Lena','Marcus','Diego','Priya','Tess','Theo','June','Mira','Naomi','Daniel','Iris','Aria','Sam','Sofia','Otto','Kit','Faye','Em','Mara','Jules'];
  uid uuid;
  ids uuid[] := '{}';
  i int;
  j int;
  m uuid;
  l uuid;
  n text;
  -- example person by first name
  p jsonb := '{}';
begin
  select id into me from auth.users where lower(email) = lower('brunapicoto@gmail.com');
  if me is null then raise exception 'no orbi account with that email yet: sign in to the app once, or change the email in this file'; end if;
  if not exists (select 1 from public.profiles where id = me) then raise exception 'finish signing in to the app first (the step where you pick your name)'; end if;

  -- start over: removing the example people removes their plans, memories and connections
  delete from auth.users where email like '%.orbi-example@example.com';
  delete from public.lists where owner = me and name = 'want to try (examples)';

  -- people
  for i in 1 .. array_length(ppl, 1) loop
    uid := gen_random_uuid();
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', lower(ppl[i]) || '.orbi-example@example.com', '', now(),
            '{"provider":"email","providers":["email"]}', '{}', now() - (i || ' days')::interval, now());
    insert into public.profiles (id, first_name, neighborhood) values (uid, ppl[i], null);
    ids := ids || uid;
    p := p || jsonb_build_object(lower(ppl[i]), uid);
  end loop;

  -- connections: with you, with each other, and with everyone already in your orbit
  for i in 1 .. array_length(ids, 1) loop
    insert into public.connections (user_a, user_b) values (least(me, ids[i]), greatest(me, ids[i])) on conflict do nothing;
    for j in i + 1 .. array_length(ids, 1) loop
      insert into public.connections (user_a, user_b) values (least(ids[i], ids[j]), greatest(ids[i], ids[j])) on conflict do nothing;
    end loop;
    insert into public.connections (user_a, user_b)
    select least(f.id, ids[i]), greatest(f.id, ids[i])
    from (select case when user_a = me then user_b else user_a end as id from public.connections where me in (user_a, user_b)) f
    where f.id <> all(ids)
    on conflict do nothing;
  end loop;

  -- upcoming plans (times in new york). hosts stay anonymous in the app.
  insert into public.plans (host_id, kind, occasion, title, place, neighborhood, lat, lng, price_level, cost_note, note, starts_at, open_spots, bringing, min_people) values
    ((p->>'lena')::uuid,   'dinner', 'after-work',          'estela',                      'Estela, Nolita',                 'nolita',            40.7212, -73.9952, 3, null, 'late dinner. i''ve been saving this table for months.', now() + interval '25 minutes', 3, 0, 3),
    ((p->>'marcus')::uuid, 'brunch', 'slow brunch',         'sailor',                      'Sailor, Fort Greene',            'fort greene',       40.6897, -73.9726, 2, null, 'no agenda. the kind of lunch that becomes dinner.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '3 days 13 hours', 5, 0, 3),
    ((p->>'diego')::uuid,  'sport',  'watching the match',  'the quarterfinal at banter',  'Banter Bar, Williamsburg',       'williamsburg',      40.7142, -73.9614, 1, null, 'world cup quarterfinal. arrive early, the good seats go fast.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '4 days 11 hours', 7, 0, 4),
    ((p->>'priya')::uuid,  'drinks', 'a round of drinks',   'a mood at attaboy',           'Attaboy, Lower East Side',       'lower east side',   40.7191, -73.9905, 2, null, 'no menu, just tell the bartender a mood. bring yours.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '2 days 21 hours', 3, 0, 3),
    ((p->>'tess')::uuid,   'run',    'morning run club',    'mccarren run club',           'McCarren Park track',            'greenpoint',        40.7213, -73.9497, 0, null, 'easy 5k, coffee after. pace is conversational, nobody gets dropped.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '3 days 8 hours', 9, 0, 4),
    ((p->>'theo')::uuid,   'dinner', 'long lunch',          'foul witch',                  'Foul Witch, East Village',       'east village',      40.7287, -73.9838, 3, null, 'the table is full. next one drops sunday.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '1 day 20 hours', 3, 0, 3),
    ((p->>'june')::uuid,   'brunch', 'new in the city',     'flat whites at sey',          'Sey Coffee, Bushwick',           'bushwick',          40.7069, -73.9235, 1, null, 'new here, learning the neighborhoods one flat white at a time.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '4 days 10 hours', 3, 0, 3),
    ((p->>'mira')::uuid,   'dinner', 'a quiet night',       'le crocodile',                'Le Crocodile, Williamsburg',     'williamsburg',      40.7208, -73.9617, 3, null, 'looking for warm conversation, not loud company.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '4 days 19 hours', 3, 0, 3),
    ((p->>'aria')::uuid,   'class',  'something to celebrate', 'wheel night',              'BKLYN Clay, Williamsburg',       'williamsburg',      40.7185, -73.9573, 2, '$65, clay and firing included', 'first time on the wheel for most of us. that''s the point.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '6 days 18 hours', 5, 0, 4),
    ((p->>'daniel')::uuid, 'hike',   'no plans, no agenda', 'breakneck ridge',             'Breakneck Ridge trailhead, Cold Spring', 'hudson valley', null, null, 0, 'metro-north, about $30 round trip', 'the 8:43 from grand central. snacks on me.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '5 days 8 hours', 5, 0, 4),
    ((p->>'sam')::uuid,    'show',   'after-work',          'late show at the cellar',     'Comedy Cellar, Greenwich Village', 'greenwich village', 40.7302, -74.0005, 2, '$25 + 2 items', null, date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '2 days 22 hours', 4, 1, 4),
    ((p->>'naomi')::uuid,  'study',  'working through something', 'finals study session',  'Butler Library, 3rd floor',      'morningside heights', 40.8064, -73.9632, 0, null, 'quiet hours, then tacos.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '1 day 14 hours', 4, 0, 3),
    ((p->>'sofia')::uuid,  'networking', 'post-workout',    'breakfast before the markets', 'Bryant Park Grill, Midtown',    'midtown',           40.7536, -73.9832, 1, null, 'buy-side, banks, anyone curious.', date_trunc('day', now() at time zone 'America/New_York') at time zone 'America/New_York' + interval '2 days 8 hours', 4, 0, 3);
  update public.plans set topic = 'finance' where host_id = (p->>'sofia')::uuid and kind = 'networking';

  -- who said yes (anonymous in the app). you're in estela (starting soon: try the check-in) and sailor.
  insert into public.rsvps (plan_id, user_id)
  select pl.id, (p->>x)::uuid from public.plans pl
  cross join lateral unnest(case pl.title
    when 'estela' then array['theo','naomi']
    when 'sailor' then array['lena','june']
    when 'the quarterfinal at banter' then array['theo','sam','marcus','aria']
    when 'a mood at attaboy' then array['mira']
    when 'mccarren run club' then array['daniel','iris','sam']
    when 'foul witch' then array['lena','aria','priya']
    when 'flat whites at sey' then array['mira']
    when 'wheel night' then array['june','kit']
    when 'breakneck ridge' then array['tess','sam','otto']
    when 'late show at the cellar' then array['diego']
    when 'finals study session' then array['iris']
    when 'breakfast before the markets' then array['lena','marcus']
    else array[]::text[] end) x
  where pl.host_id = any(ids);
  insert into public.rsvps (plan_id, user_id)
  select id, me from public.plans where host_id = any(ids) and title in ('estela', 'sailor');
  -- estela: the host and theo are already inside
  insert into public.plan_checkins (plan_id, user_id)
  select pl.id, u from public.plans pl cross join lateral unnest(array[pl.host_id, (p->>'theo')::uuid]) u
  where pl.host_id = any(ids) and pl.title = 'estela';

  -- two plans you went to (they show in memories, the names already revealed)
  insert into public.plans (host_id, kind, occasion, title, place, neighborhood, note, starts_at, open_spots, bringing, min_people) values
    ((p->>'naomi')::uuid, 'show', 'after-work', 'comedy cellar', 'Comedy Cellar, Greenwich Village', 'greenwich village', null, now() - interval '3 days', 4, 0, 3),
    ((p->>'theo')::uuid,  'run',  'morning run club', 'williamsburg bridge loop', 'Williamsburg Bridge loop', 'williamsburg', null, now() - interval '10 days', 4, 0, 3);
  insert into public.rsvps (plan_id, user_id)
  select pl.id, u from public.plans pl
  cross join lateral unnest(case pl.title when 'comedy cellar' then array[me, (p->>'lena')::uuid, (p->>'marcus')::uuid] else array[me, (p->>'marcus')::uuid, (p->>'iris')::uuid] end) u
  where pl.host_id = any(ids) and pl.starts_at < now();
  insert into public.plan_checkins (plan_id, user_id, checked_at)
  select pl.id, x.u, pl.starts_at from public.plans pl
  cross join lateral (select pl.host_id as u union select user_id from public.rsvps r where r.plan_id = pl.id) x
  where pl.host_id = any(ids) and pl.starts_at < now()
  on conflict do nothing;

  -- memories from the design, with anonymous ratings (shown once 3 people have rated)
  -- format: creator, kind, place, neighborhood, mood, days ago, note, tagged (accepted), ratings by creator then tagged
  for n in select unnest(array[
    'naomi|dinner|Lilia, Williamsburg|williamsburg|a quiet night|4|the table forgot what time it was.|daniel,iris,ME|5,5,4,5',
    'theo|drinks|Wildair, Lower East Side|lower east side|after-work|19|natural wine, small plates, big laughs.|mara,jules|4,5,4',
    'aria|dinner|Misi, Williamsburg|williamsburg|long lunch|28||ME,daniel,em,naomi|5,5,4,5,5',
    'sam|party|Claud, East Village|east village|someone''s birthday|42|otto''s birthday. the dessert came with sparklers.|otto,kit|5,5,4',
    'sam|dinner|Don Angie, West Village|west village|long lunch|69|pinwheel lasagna for the table.|aria,faye,ME|5,4,5,5',
    'lena|dinner|Via Carota, West Village|west village|someone''s birthday|5|birthday dinner. the cacio e pepe lived up to it.|naomi,theo|5,5,4',
    'sofia|dinner|Via Carota|west village|a quiet night|16||marcus,iris,lena|5,4,5,5',
    'marcus|run|Central Park loop|upper west side|morning run club|4|saturday 6 miles, then bagels.|theo,iris,ME|5,5,4,5',
    'theo|run|Brooklyn Bridge Park|dumbo|morning run club|11||sofia,naomi|5,4,5',
    'iris|gallery|Dia Beacon|hudson valley|no plans, no agenda|20|a whole day, one train ride.|sofia,tess|5,5,4'
  ]) loop
    declare
      f text[] := string_to_array(n, '|');
      creator uuid := (p->>f[1])::uuid;
      tagged text[] := string_to_array(f[8], ',');
      stars int[] := string_to_array(f[9], ',')::int[];
      who uuid;
      k int;
    begin
      insert into public.memories (created_by, kind, place, neighborhood, occasion, happened_on, note)
      values (creator, f[2], f[3], f[4], f[5], current_date - f[6]::int, nullif(f[7], '')) returning id into m;
      insert into public.memory_ratings (memory_id, user_id, value) values (m, creator, stars[1]);
      for k in 1 .. coalesce(array_length(tagged, 1), 0) loop
        who := case when tagged[k] = 'ME' then me else (p->>tagged[k])::uuid end;
        insert into public.memory_people (memory_id, user_id, status) values (m, who, 'accepted');
        -- you haven't rated yours yet: try it in the app
        if tagged[k] <> 'ME' then
          insert into public.memory_ratings (memory_id, user_id, value) values (m, who, stars[k + 1]);
        end if;
      end loop;
    end;
  end loop;

  -- a list of places for you
  insert into public.lists (owner, name) values (me, 'want to try (examples)') returning id into l;
  insert into public.list_places (list_id, name, neighborhood, category, note) values
    (l, 'Sey Coffee', 'bushwick', 'coffee', 'the light roast everyone talks about'),
    (l, 'Attaboy', 'lower east side', 'bar', 'no menu, tell them a mood'),
    (l, 'Little Island', 'meatpacking', 'park', null),
    (l, 'Don Angie', 'west village', 'restaurant', 'pinwheel lasagna'),
    (l, 'Devoción', 'williamsburg', 'coffee', 'the skylight room'),
    (l, 'BKLYN Clay', 'williamsburg', 'activity', 'wheel class for beginners'),
    (l, 'Comedy Cellar', 'greenwich village', 'gem', 'the late show');
end $$;
