-- Removes everything design_examples.sql added: the example people (and with them their plans,
-- memories, ratings, connections and rsvps), and your example list. Your own data stays.
-- If you signed in to the app with a different email, change it below.
delete from auth.users where email like '%.orbi-example@example.com';
delete from public.lists
where name = 'want to try (examples)'
  and owner = (select id from auth.users where lower(email) = lower('brunapicoto@gmail.com'));
