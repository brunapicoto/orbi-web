-- Test data for your own account: three plans that already happened, so Memories isn't empty.
-- You host each one and "bring 2 friends", so they reach 3 without inventing anyone.
-- Add the group photos from the app. To remove them, run remove_my_test_memories.sql.
-- If you signed in to the app with a different email, change it below.
do $$
declare
  me uuid;
begin
  select id into me from auth.users where lower(email) = lower('brunapicoto@gmail.com');
  if me is null then
    raise exception 'no orbi account with that email yet: sign in to the app once, or change the email in this file';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'finish signing in to the app first (the step where you pick your name)';
  end if;
  insert into public.plans (host_id, kind, place, note, starts_at, open_spots, bringing) values
    (me, 'dinner',  'Lilia, Williamsburg',      'test plan: a birthday dinner', now() - interval '3 days',  1, 2),
    (me, 'run',     'Williamsburg Bridge loop', 'test plan: sunrise run',       now() - interval '10 days', 1, 2),
    (me, 'gallery', 'Dia Beacon',               'test plan: a slow afternoon',  now() - interval '24 days', 1, 2);
end $$;
