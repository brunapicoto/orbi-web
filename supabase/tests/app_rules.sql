\set ON_ERROR_STOP 1
-- users
insert into auth.users values
 ('00000000-0000-0000-0000-00000000000a'),('00000000-0000-0000-0000-00000000000b'),
 ('00000000-0000-0000-0000-00000000000c'),('00000000-0000-0000-0000-00000000000d'),
 ('00000000-0000-0000-0000-00000000000e');
create function pg_temp.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false) $$;
create function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'PASS  % (blocked: %)', label, sqlerrm; return; end;
  raise exception 'FAIL  % should have been blocked', label;
end $$;
create function pg_temp.check(ok boolean, label text) returns void language plpgsql as $$
begin if ok then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if; end $$;
grant execute on all functions in schema pg_temp to authenticated;

-- each person creates their own profile
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); insert into profiles (id, first_name) values (auth.uid(), 'Ana');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); insert into profiles (id, first_name) values (auth.uid(), 'Bia');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); insert into profiles (id, first_name) values (auth.uid(), 'Caio');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d'); insert into profiles (id, first_name) values (auth.uid(), 'Duda');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e'); insert into profiles (id, first_name) values (auth.uid(), 'Eva');
select pg_temp.expect_fail($$insert into profiles (id, first_name) values ('00000000-0000-0000-0000-00000000000a', 'Fake')$$, 'cannot create a profile for someone else');
reset role;

-- invites: Bia, Caio, Duda accept Ana's link; Eva accepts only Bia's
create temp table codes as select first_name, invite_code from profiles;
grant select on codes to authenticated;
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select pg_temp.check(accept_invite((select invite_code from codes where first_name='Ana')) = 'Ana', 'Bia accepts Ana''s invite');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select accept_invite((select invite_code from codes where first_name='Ana'));
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d'); select accept_invite((select invite_code from codes where first_name='Ana'));
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e'); select accept_invite((select invite_code from codes where first_name='Bia'));
select pg_temp.expect_fail($$select accept_invite('nope')$$, 'a made-up invite code does nothing');

-- Ana posts plans
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots) values ('dinner','Estela', now() + interval '1 day', 1)$$, 'a plan needs at least 2 open spots (3 people)');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots) values ('dinner','Estela', now() - interval '1 hour', 3)$$, 'a plan cannot start in the past');
insert into plans (id, kind, place, starts_at, open_spots) values
 ('11111111-0000-0000-0000-000000000001','dinner','Estela', now() + interval '1 day', 3),
 ('11111111-0000-0000-0000-000000000003','sauna','Bathhouse', now() + interval '2 days', 2),
 ('11111111-0000-0000-0000-000000000004','run','East River', now() + interval '3 days', 4);

-- what Bia (a connection) sees
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from my_plans()) = 3, 'Bia sees Ana''s 3 plans in my_plans()');
select pg_temp.check((select count(*) from plans) = 0, 'Bia cannot read the plans table directly (it holds the host)');
select pg_temp.check(pg_get_function_result('public.my_plans()'::regprocedure) not ilike '%host_id%', 'my_plans() returns no host column');
select pg_temp.check((select string_agg(first_name, ',' order by first_name) from profiles) = 'Ana,Bia,Eva', 'Bia sees only herself and her connections (Ana, Eva), not Caio');

-- Eva is not connected to Ana
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*) from my_plans()) = 0, 'Eva (not connected to Ana) sees none of Ana''s plans');
select pg_temp.expect_fail($$select join_plan('11111111-0000-0000-0000-000000000001')$$, 'Eva cannot join a plan she cannot see');

-- blind RSVP on the dinner
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_plan('11111111-0000-0000-0000-000000000001');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_plan('11111111-0000-0000-0000-000000000001');
select pg_temp.check((select count(*) from rsvps) = 1, 'Caio can see only his own RSVP, not Bia''s');
select pg_temp.check((select taken from my_plans() where id='11111111-0000-0000-0000-000000000001') = 2, 'Caio sees a count (2 in) but no names');
select pg_temp.check((select status from my_plans() where id='11111111-0000-0000-0000-000000000001') = 'on', 'with the host plus 2 the plan is on');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000001')) = 0, 'before start time nobody gets names');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000001')) = 0, 'not even the host gets names before start');
select pg_temp.check((select count(*) from rsvps) = 0, 'the host cannot read the RSVP rows');
select pg_temp.expect_fail($$select join_plan('11111111-0000-0000-0000-000000000001')$$, 'the host cannot join their own plan');

-- full plan
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_plan('11111111-0000-0000-0000-000000000003');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_plan('11111111-0000-0000-0000-000000000003');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.expect_fail($$select join_plan('11111111-0000-0000-0000-000000000003')$$, 'a full plan takes no more people');

-- the run gets only one yes
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_plan('11111111-0000-0000-0000-000000000004');
select pg_temp.check((select status from my_plans() where id='11111111-0000-0000-0000-000000000004') = 'open', 'host plus 1 is still open');
reset role;

-- time passes: the dinner and the run start
update plans set starts_at = now() - interval '30 minutes' where id in ('11111111-0000-0000-0000-000000000001','11111111-0000-0000-0000-000000000004');
set role authenticated;

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000001')) = 0, 'at start time, before checking in, Bia still gets no names');
select pg_temp.check(check_in('11111111-0000-0000-0000-000000000001') = 1, 'Bia checks in at the door: 1 arrived');
select pg_temp.check((select arrived from my_plans() where id='11111111-0000-0000-0000-000000000001') = 1 and (select me_checked_in from my_plans() where id='11111111-0000-0000-0000-000000000001'), 'she sees 1 arrived, and that it is her');
select pg_temp.check((select string_agg(first_name, ',' order by first_name) from plan_people('11111111-0000-0000-0000-000000000001')) = 'Ana,Bia,Caio', 'after checking in Bia sees who is there: Ana, Bia, Caio');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000001') where arrived) = 1, 'and who has arrived (only her so far)');
select pg_temp.check((select photo_path from plan_people('11111111-0000-0000-0000-000000000001') where first_name = 'Caio') is null, 'no photo of Caio: he is not in her orbit');
select pg_temp.expect_fail($$select check_in('11111111-0000-0000-0000-000000000004')$$, 'no check-in for a plan that did not reach its minimum');
select pg_temp.expect_fail($$select check_in('11111111-0000-0000-0000-000000000003')$$, 'no check-in more than an hour before');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select check_in('11111111-0000-0000-0000-000000000001');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); select check_in('11111111-0000-0000-0000-000000000001');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.expect_fail($$select check_in('11111111-0000-0000-0000-000000000001')$$, 'Duda, not in the dinner, cannot check in');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select first_name from plan_people('11111111-0000-0000-0000-000000000001') where is_host) = 'Ana', 'and who hosted');
select pg_temp.check((select status from my_plans() where id='11111111-0000-0000-0000-000000000001') = 'live', 'the dinner is live');
select leave_plan('11111111-0000-0000-0000-000000000001');
select pg_temp.check((select count(*) from rsvps where plan_id='11111111-0000-0000-0000-000000000001') = 1, 'you cannot quietly leave after it started');
select pg_temp.check((select count(*) from my_plans() where id='11111111-0000-0000-0000-000000000004') = 0, 'the run that did not reach 3 quietly disappears for Bia');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000004')) = 0, 'and nobody gets its names');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from my_plans() where id='11111111-0000-0000-0000-000000000004') = 0, 'the run disappears for the host too, no "no"');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000001')) = 0, 'Duda (connected, but not in the dinner) gets no names');
select pg_temp.check((select count(*) from my_plans() where id='11111111-0000-0000-0000-000000000001') = 0, 'and a started plan drops off Duda''s list');

-- photos
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into plan_photos (plan_id, path) values ('11111111-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001/a.jpg');
insert into storage.objects (bucket_id, name) values ('plan-photos', '11111111-0000-0000-0000-000000000001/a.jpg');
select pg_temp.check((select count(*) from storage.objects) = 1, 'Bia can upload and see the dinner photo');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('plan-photos', '11111111-0000-0000-0000-000000000003/b.jpg')$$, 'no photos before a plan starts');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select count(*) from storage.objects) = 0, 'Duda cannot see the dinner photo');
select pg_temp.check((select count(*) from plan_photos) = 0, 'or its record');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('plan-photos', '11111111-0000-0000-0000-000000000001/c.jpg')$$, 'Duda cannot upload to a plan she was not in');
reset role;


-- ---------------------------------------------------------------- friends the host brings
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots, bringing) values ('run','Hudson', now() + interval '1 day', 1, 0)$$, 'host + 1 open spot is too small (needs 3)');
insert into plans (id, kind, place, starts_at, open_spots, bringing) values ('11111111-0000-0000-0000-000000000006','bar','Barcade', now() + interval '1 day', 1, 1);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d'); select join_plan('11111111-0000-0000-0000-000000000006');
select pg_temp.check((select status from my_plans() where id='11111111-0000-0000-0000-000000000006') = 'on', 'host + 1 friend they bring + 1 yes = 3, so it is on');
select pg_temp.check((select bringing from my_plans() where id='11111111-0000-0000-0000-000000000006') = 1, 'people see that the host is bringing 1 friend');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_fail($$select join_plan('11111111-0000-0000-0000-000000000006')$$, 'the one open spot is taken');

-- ---------------------------------------------------------------- keep in orbit (the dinner has started: Ana, Bia, Caio)
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check(keep_in_orbit('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c') = 'picked', 'Bia quietly picks Caio');
select pg_temp.check((select count(*) from profiles where first_name = 'Caio') = 0, 'a one-sided pick connects nobody');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from orbit_picks) = 0, 'Caio cannot see that Bia picked him');
select pg_temp.check(keep_in_orbit('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b') = 'connected', 'Caio picks Bia back: they are connected');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from profiles where first_name = 'Caio') = 1, 'now Bia sees Caio in her orbit');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.expect_fail($$select keep_in_orbit('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b')$$, 'Duda was not at the dinner, she cannot pick from it');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_fail($$select keep_in_orbit('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-00000000000c')$$, 'no picks before a plan starts');
reset role;

-- ---------------------------------------------------------------- trust signal (group level only)
reset role;
insert into auth.users values ('00000000-0000-0000-0000-00000000000f'),('00000000-0000-0000-0000-000000000010');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000f'); insert into profiles (id, first_name) values (auth.uid(), 'Fabi');
select accept_invite((select invite_code from codes where first_name='Ana'));
select pg_temp.as_user('00000000-0000-0000-0000-000000000010'); insert into profiles (id, first_name) values (auth.uid(), 'Gabi');
select accept_invite((select invite_code from codes where first_name='Ana'));
-- Bia and Caio also know each other, so Bia shares friends with the group
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select accept_invite((select invite_code from codes where first_name='Bia'));

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into plans (id, kind, place, starts_at, open_spots) values ('11111111-0000-0000-0000-000000000005','dinner','Lilia', now() + interval '1 day', 6);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_plan('11111111-0000-0000-0000-000000000005');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d'); select join_plan('11111111-0000-0000-0000-000000000005');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select others from plan_signal('11111111-0000-0000-0000-000000000005')) = 3, 'Bia sees how many others are in (3)');
select pg_temp.check((select band from plan_signal('11111111-0000-0000-0000-000000000005')) is null, 'with fewer than 4 others there is no mutual-friends band');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000f'); select join_plan('11111111-0000-0000-0000-000000000005');
select pg_temp.as_user('00000000-0000-0000-0000-000000000010'); select join_plan('11111111-0000-0000-0000-000000000005');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select band from plan_signal('11111111-0000-0000-0000-000000000005')) = 'a few', 'with 5 others Bia gets a coarse band ("a few"), not a number');
select pg_temp.check(pg_get_function_result('public.plan_signal(uuid)'::regprocedure) not ilike '%user%', 'plan_signal returns no person, only the group');
select pg_temp.expect_fail($$select mutual_count('00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000c')$$, 'the app cannot ask for a mutual count about one person');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*) from plan_signal('11111111-0000-0000-0000-000000000005')) = 0, 'Eva (outside the network) gets no signal at all');

-- after the reveal, one exact number for the whole group is the icebreaker
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_plan('11111111-0000-0000-0000-000000000005');
select pg_temp.check(plan_group_mutuals('11111111-0000-0000-0000-000000000005') = 0, 'no group number before start (0 = nothing shown)');
reset role;
update plans set starts_at = now() - interval '10 minutes' where id = '11111111-0000-0000-0000-000000000005';
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
-- Bia's friends: Ana, Eva, Caio. Outside the plan only Eva counts, and Eva is nobody's friend in the group.
select check_in('11111111-0000-0000-0000-000000000005');
select pg_temp.check(plan_group_mutuals('11111111-0000-0000-0000-000000000005') = 0, 'friends already in the plan are not counted');
select pg_temp.check(pg_get_function_result('public.plan_people(uuid)'::regprocedure) not ilike '%mutual%', 'the reveal list has no per-person friend counts');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check(plan_group_mutuals('11111111-0000-0000-0000-000000000005') = 0, 'Eva, not in the plan, gets nothing');
reset role;
-- give Bia a friend outside the plan who knows Caio: Eva accepts Caio's link
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e'); select accept_invite((select invite_code from codes where first_name='Caio'));
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check(plan_group_mutuals('11111111-0000-0000-0000-000000000005') = 1, 'at the reveal Bia sees one exact number for the group: 1 friend in common (Eva)');
reset role;

-- ---------------------------------------------------------------- networking plans
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
insert into plans (id, kind, topic, place, starts_at, open_spots) values ('11111111-0000-0000-0000-000000000007','networking','finance','Midtown coffee', now() + interval '2 days', 3);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select topic from my_plans() where id = '11111111-0000-0000-0000-000000000007') = 'finance', 'a networking plan shows its field (finance)');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_fail($$insert into plans (kind, topic, place, starts_at, open_spots) values ('dinner','finance','Lilia', now() + interval '1 day', 3)$$, 'only networking plans have a field');
select pg_temp.expect_fail($$insert into plans (kind, topic, place, starts_at, open_spots) values ('networking','crypto bros','Midtown', now() + interval '1 day', 3)$$, 'only known fields');
reset role;

-- ---------------------------------------------------------------- memories you add yourself
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
-- Ana tags Bia and Duda (connections) and Eva (not her connection: ignored)
select set_config('t.mem', add_memory('dinner', 'Lilia', current_date - 3, 'birthday dinner',
  array['00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000d','00000000-0000-0000-0000-00000000000e']::uuid[])::text, false);
select pg_temp.check((select count(*) from my_memories()) = 1, 'Ana sees the memory she added');
select pg_temp.check((select waiting from my_memories()) = 2, 'she sees 2 people invited (Eva was not her connection, so not tagged)');
select pg_temp.check((select cardinality(with_names) from my_memories()) = 0, 'no names until people accept');
select pg_temp.expect_fail($$select add_memory('run','Hudson', current_date + 1, null, '{}')$$, 'a memory cannot be in the future');
select pg_temp.expect_fail($$select * from memories$$, 'nobody reads the memories table directly');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from my_memories()) = 0, 'Bia does not see it before accepting');
select pg_temp.check((select from_name from memory_invites()) = 'Ana', 'Bia gets an invite from Ana');
select answer_memory(current_setting('t.mem')::uuid, true);
select pg_temp.check((select count(*) from my_memories()) = 1, 'after accepting, Bia sees it');
select pg_temp.check((select with_names from my_memories()) = '{Ana}', 'with Ana (Duda has not accepted)');
insert into memory_photos (memory_id, path) values (current_setting('t.mem')::uuid, current_setting('t.mem') || '/a.jpg');
insert into storage.objects (bucket_id, name) values ('memory-photos', current_setting('t.mem') || '/a.jpg');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'memory-photos') = 1, 'Bia can add a photo to it');

-- "accept and blur me": Ana swaps Bia's photo for a blurred copy
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'memory-photos') = 1, 'Ana sees the photo');
insert into storage.objects (bucket_id, name) values ('memory-photos', current_setting('t.mem') || '/a-blur.jpg');
select replace_memory_photo((select id from memory_photos where path = current_setting('t.mem') || '/a.jpg'), current_setting('t.mem') || '/a-blur.jpg');
select pg_temp.check((select path from memory_photos) = current_setting('t.mem') || '/a-blur.jpg', 'the memory now shows the blurred copy');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select array_agg(name) from storage.objects where bucket_id = 'memory-photos') = array[current_setting('t.mem') || '/a.jpg', current_setting('t.mem') || '/a-blur.jpg'], 'Bia, who took it, still has her original');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select array_agg(name) from storage.objects where bucket_id = 'memory-photos') = array[current_setting('t.mem') || '/a-blur.jpg'], 'everyone else only gets the blurred copy');
select pg_temp.expect_fail($$select replace_memory_photo((select id from memory_photos limit 1), 'someone-else/x.jpg')$$, 'a photo can only be swapped within its memory');
select pg_temp.expect_fail($$select replace_memory_photo((select id from memory_photos limit 1), current_setting('t.mem') || '/never-uploaded.jpg')$$, 'and only for a file that was uploaded');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select answer_memory(current_setting('t.mem')::uuid, false);
select pg_temp.check((select count(*) from memory_invites()) = 0, 'Duda declines: the invite is gone');
select pg_temp.check((select count(*) from my_memories()) = 1, 'she is in Ana''s network, so she still sees it, untagged');
select pg_temp.check(not (select with_names from my_memories()) @> '{Duda}' and (select with_names from my_memories()) = '{Ana,Bia}', 'without her name on it');
select pg_temp.check((select in_it from my_memories()) = false, 'and she is not in it: she declined');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'memory-photos') = 1, 'she sees the photo (the blurred copy)');

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select waiting from my_memories()) = 0, 'Ana sees nobody waiting, and no "no"');
select pg_temp.check((select with_names from my_memories()) = '{Bia}', 'and Bia with her');

-- seeing: the creator's network
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from my_memories() where id = current_setting('t.mem')::uuid) = 1, 'Caio (Ana''s network, never tagged) sees the memory');
select pg_temp.check((select in_it from my_memories() where id = current_setting('t.mem')::uuid) = false, 'he is not in it');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('memory-photos', current_setting('t.mem') || '/c.jpg')$$, 'so he cannot add photos');
select pg_temp.expect_fail($$select replace_memory_photo((select id from memory_photos limit 1), current_setting('t.mem') || '/a-blur.jpg')$$, 'or change one');

-- a tagged person's network: Eva is connected to Bia, who accepted
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*) from my_memories() where id = current_setting('t.mem')::uuid) = 1, 'Eva (Bia''s network) sees it');
select pg_temp.check((select in_it from my_memories() where id = current_setting('t.mem')::uuid) = false, 'without being in it');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('memory-photos', current_setting('t.mem') || '/x.jpg')$$, 'and cannot add photos');
select pg_temp.as_user('00000000-0000-0000-0000-000000000011');
select pg_temp.check((select count(*) from my_memories()) = 0, 'someone outside every network sees nothing');
select pg_temp.expect_fail($$select replace_memory_photo((select id from memory_photos limit 1), current_setting('t.mem') || '/a-blur.jpg')$$, 'or swap them');
reset role;

-- ---------------------------------------------------------------- experience ratings (never people)
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select set_config('t.m1', add_memory('hike', 'Pinch Chinese, SoHo', current_date - 3, null, array['00000000-0000-0000-0000-00000000000b','00000000-0000-0000-0000-00000000000c','00000000-0000-0000-0000-00000000000d']::uuid[])::text, false);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select answer_memory(current_setting('t.m1')::uuid, true);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select answer_memory(current_setting('t.m1')::uuid, true);
-- Duda leaves her tag pending

select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); select rate_memory(current_setting('t.m1')::uuid, 5);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select rate_memory(current_setting('t.m1')::uuid, 4);
select pg_temp.check((select rating from my_memories() where id = current_setting('t.m1')::uuid) is null and (select ratings from my_memories() where id = current_setting('t.m1')::uuid) is null, 'with 2 people rated, no average and no count');
select pg_temp.check(my_memory_rating(current_setting('t.m1')::uuid) = 4, 'Bia sees her own rating, only hers');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select rate_memory(current_setting('t.m1')::uuid, 5);
select pg_temp.check((select rating from my_memories() where id = current_setting('t.m1')::uuid) = 4.7 and (select ratings from my_memories() where id = current_setting('t.m1')::uuid) = 3, 'at 3 people: 4.7 from 3 ratings');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select rate_memory(current_setting('t.m1')::uuid, 3);
select pg_temp.check((select rating from my_memories() where id = current_setting('t.m1')::uuid) = 4.3 and (select ratings from my_memories() where id = current_setting('t.m1')::uuid) = 3, 'Bia changes hers: one rating each, the average updates (4.3)');
select pg_temp.expect_fail($$select rate_memory(current_setting('t.m1')::uuid, 6)$$, '1 to 5 only');

-- who cannot rate
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.expect_fail($$select rate_memory(current_setting('t.m1')::uuid, 5)$$, 'Duda, tagged but not confirmed, cannot rate');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000e');
select pg_temp.check((select count(*) from my_memories() where id = current_setting('t.m1')::uuid) = 1, 'Eva (Bia''s network) sees it');
select pg_temp.check((select rating from my_memories() where id = current_setting('t.m1')::uuid) = 4.3, 'and its rating');
select pg_temp.expect_fail($$select rate_memory(current_setting('t.m1')::uuid, 5)$$, 'but she was not there, so she cannot rate');
select pg_temp.expect_fail($$select * from memory_ratings$$, 'nobody reads the ratings table');
select pg_temp.expect_fail($$select * from rating_summary(array[current_setting('t.m1')::uuid])$$, 'or sums up memories they pick');
select pg_temp.check(
  pg_get_function_result('public.my_memories()'::regprocedure) || pg_get_function_result('public.experience_summary(text, text)'::regprocedure)
  || pg_get_function_result('public.memory_rating(uuid)'::regprocedure) not ilike '%user%',
  'no rating function returns who rated');

-- a second time at the same place (another name style), rated by 2
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select set_config('t.m2', add_memory('hike', '  pinch   CHINESE ', current_date - 1, null, array['00000000-0000-0000-0000-00000000000a']::uuid[])::text, false);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a'); select answer_memory(current_setting('t.m2')::uuid, true);
select rate_memory(current_setting('t.m2')::uuid, 2);
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select rate_memory(current_setting('t.m2')::uuid, 2);
select pg_temp.check((select ratings from my_memories() where id = current_setting('t.m2')::uuid) is null, 'the new one has its own rating: hidden, only 2 people');
select pg_temp.check((select rating from my_memories() where id = current_setting('t.m1')::uuid) = 4.3, 'the first keeps its own 4.3');

-- the place: every rating counts once (5,3,5,2,2 = 3.4), not the average of averages
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select place_key from my_memories() where id = current_setting('t.m2')::uuid) = 'pinch chinese', 'both are "pinch chinese"');
select pg_temp.check((select average from experience_summary('pinch chinese', null)) = 3.4, 'the place: 3.4, all ratings weighted equally');
select pg_temp.check((select ratings from experience_summary('pinch chinese', null)) = 5 and (select experiences from experience_summary('pinch chinese', null)) = 2, 'from 5 ratings over 2 experiences');
select pg_temp.check((select average from experience_summary(null, 'hike')) = 3.4 and (select experiences from experience_summary(null, 'hike')) = 2, 'the activity (hiking) works the same way');
select pg_temp.check((select count(*) from experience_summary(null, null) where average is not null) = 0, 'nothing to sum up without a place or activity');

-- the threshold is per viewer: only what you can see is summed up
select pg_temp.as_user('00000000-0000-0000-0000-00000000000d');
select pg_temp.check((select experiences from experience_summary('pinch chinese', null)) = 1, 'Duda (pending on the first) sees only the second');
select pg_temp.check((select average from experience_summary('pinch chinese', null)) is null, 'which has 2 people rated: no score for her');
select pg_temp.as_user('00000000-0000-0000-0000-000000000011');
select pg_temp.check((select experiences from experience_summary('pinch chinese', null)) = 0 and (select average from experience_summary('pinch chinese', null)) is null, 'someone outside every network gets nothing');
reset role;

-- ---------------------------------------------------------------- anonymous host, popular, blocking, leaving
set role authenticated;
-- popular this week: places by number of experiences, with the score only past 3 people
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select key from popular_experiences(current_date - 7, current_date) limit 1) = 'pinch chinese', 'the most popular place this week: pinch chinese (2 experiences)');
select pg_temp.check((select experiences from popular_experiences(current_date - 7, current_date) where key = 'pinch chinese') = 2 and (select average from popular_experiences(current_date - 7, current_date) where key = 'pinch chinese') = 3.4, 'with its weighted score');
select pg_temp.check((select experiences from popular_experiences(current_date - 7, current_date, 'kind') where key = 'hike') = 2, 'or by activity: 2 hikes');
select pg_temp.check((select count(*) from popular_experiences(current_date + 1, current_date + 7)) = 0, 'nothing in a week that has not happened');
select pg_temp.check(pg_get_function_result('public.popular_experiences(date, date, text)'::regprocedure) not ilike '%user%', 'popular lists experiences, never people');

-- blocking: quiet, both ways, and it ends the connection
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select block_person('00000000-0000-0000-0000-00000000000a');
select pg_temp.check(not are_connected('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c'), 'Caio blocks Ana: they are no longer connected');
select pg_temp.check((select count(*) from my_plans() where id = '11111111-0000-0000-0000-000000000009') = 0, 'her plans disappear for him');
select pg_temp.check((select first_name from my_blocks()) = 'Ana', 'he sees her in his blocked list');
select pg_temp.check((select count(*) from my_memories() where id = current_setting('t.m1')::uuid) = 0, 'her memories disappear for him too');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_fail($$select * from blocks$$, 'nobody reads the blocks table: Ana is never told');
select unblock_person('00000000-0000-0000-0000-00000000000c');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select count(*) from my_blocks()) = 1, 'only the person who blocked can undo it');
select unblock_person('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from my_blocks()) = 0, 'Caio lets Ana back in (the connection does not come back by itself)');
select pg_temp.check(not are_connected('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c'), 'still not connected');
select accept_invite((select invite_code from codes where first_name='Ana'));

-- your photo: you and your orbit
insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-00000000000c/me.jpg');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('avatars', '00000000-0000-0000-0000-00000000000b/me.jpg')$$, 'nobody uploads a photo as someone else');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'avatars') = 1, 'Bia (in Caio''s orbit) sees his photo');
select pg_temp.as_user('00000000-0000-0000-0000-000000000011');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'avatars') = 0, 'someone outside his orbit does not');
reset role;

-- ---------------------------------------------------------------- preferences are private
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into preferences (kinds, times, areas, group_size) values ('{run,gallery}', '{weekend-morning}', '{brooklyn}', 'small');
select pg_temp.check((select kinds from preferences) = '{run,gallery}', 'Bia saves what she is into');
update preferences set group_size = 'medium';
select pg_temp.check((select group_size from preferences) = 'medium', 'and can change it any time');
select pg_temp.expect_fail($$insert into preferences (user_id, kinds) values ('00000000-0000-0000-0000-00000000000c', '{sauna}')$$, 'nobody can write preferences for someone else');
select pg_temp.expect_fail($$update preferences set group_size = 'huge'$$, 'only known group sizes');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from preferences) = 0, 'Ana cannot see Bia''s preferences');
reset role;

-- ---------------------------------------------------------------- plans from a link, the public page
insert into auth.users values ('00000000-0000-0000-0000-000000000011');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000011'); insert into profiles (id, first_name) values (auth.uid(), 'Hugo');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots, min_people) values ('dinner','Lilia', now() + interval '1 day', 3, 2)$$, 'the minimum is never below 3');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots, min_people) values ('dinner','Lilia', now() + interval '1 day', 3, 5)$$, 'the minimum cannot be more than the group holds');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots, lat) values ('dinner','Lilia', now() + interval '1 day', 3, 40.7)$$, 'a pin needs both coordinates');
select pg_temp.expect_fail($$insert into plans (kind, place, starts_at, open_spots, source_url) values ('dinner','Lilia', now() + interval '1 day', 3, 'javascript:alert(1)')$$, 'links must be https');
insert into plans (id, kind, title, place, neighborhood, starts_at, open_spots, min_people, share_slug, lat, lng, price_level, source_url)
  values ('11111111-0000-0000-0000-000000000008', 'dinner', 'pasta bar', 'Via Carota', 'west village', now() + interval '2 days', 3, 4, 'pastabar01', 40.733, -74.004, 2, 'https://www.tiktok.com/@x/video/1');
insert into plans (id, kind, place, starts_at, open_spots, share_slug, occasion)
  values ('11111111-0000-0000-0000-000000000009', 'study', 'Butler Library', now() + interval '2 days', 3, 'butler0001', 'finals week');
select pg_temp.check((select share_slug from my_plans() where id = '11111111-0000-0000-0000-000000000005') is not null, 'every plan gets a share link, old ones too');
select pg_temp.check((select min_people from my_plans() where id = '11111111-0000-0000-0000-000000000005') = 3, 'old plans keep a minimum of 3');
reset role;

set role anon;
select pg_temp.check((select title from plan_teaser('pastabar01')) = 'pasta bar', 'anyone with the link sees the teaser');
select pg_temp.check((select going from plan_teaser('pastabar01')) = 1 and (select status from plan_teaser('pastabar01')) = 'open', 'with "1 of 4 in", waiting');
select pg_temp.check((select host_mutuals from plan_teaser('pastabar01')) is null, 'and nothing about the host when signed out');
select pg_temp.check(pg_get_function_result('public.plan_teaser(text)'::regprocedure) not ilike '%host_id%', 'the teaser never returns a host id');
select pg_temp.check(pg_get_function_result('public.plan_teaser(text)'::regprocedure) not ilike '%name%', 'the teaser has no name field at all: the host is always anonymous');
select pg_temp.check((select count(*) from plan_teaser('nope')) = 0, 'an unknown link shows nothing');
select pg_temp.expect_fail($$select join_via_link('pastabar01')$$, 'signed-out visitors cannot join');
select pg_temp.check((select count(*) from pg_proc where proname = 'link_host_name') = 0, 'no function tells who hosts a link');
select pg_temp.expect_fail($$select * from plans$$, 'or read plans directly');
reset role;

set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000011');
select pg_temp.check((select count(*) from my_plans()) = 0, 'Hugo, not in Ana''s orbit, does not see her plans in the app');
select pg_temp.check((select connected from plan_teaser('pastabar01')) = false, 'the link page knows he is not connected yet');
select pg_temp.check((select host_mutuals from plan_teaser('pastabar01')) = 0, 'signed in, he sees how many mutuals he shares with the host (0), not who');
select pg_temp.check(join_via_link('pastabar01') = '11111111-0000-0000-0000-000000000008', 'he says "i''m in" from the link');
select pg_temp.check(are_connected('00000000-0000-0000-0000-00000000000a', auth.uid()), 'which puts him in Ana''s orbit');
select pg_temp.check((select joined from plan_teaser('pastabar01')) and (select going from plan_teaser('pastabar01')) = 2, 'and in the plan: 2 of 4');
select pg_temp.check(join_via_link('pastabar01') = '11111111-0000-0000-0000-000000000008', 'saying it twice changes nothing');
select pg_temp.check((select going from plan_teaser('pastabar01')) = 2, 'still 2 of 4');
select pg_temp.check((select count(*) from plan_people('11111111-0000-0000-0000-000000000008')) = 0, 'he still cannot see who else is in');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b'); select join_plan('11111111-0000-0000-0000-000000000008');
select pg_temp.check((select status from plan_teaser('pastabar01')) = 'open', '3 of 4 is not enough for a plan that needs 4');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c'); select join_plan('11111111-0000-0000-0000-000000000008');
select pg_temp.check((select status from plan_teaser('pastabar01')) = 'on', '4 of 4: confirmed');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_fail($$select join_via_link('pastabar01')$$, 'the host cannot join their own plan from the link');
reset role;

-- the host is anonymous in the app too
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select pg_temp.check((select host_mutuals from my_plans() where id = '11111111-0000-0000-0000-000000000009') >= 1, 'Caio sees "someone with N mutuals is hosting" (at least Bia), never the name');
select pg_temp.check(pg_get_function_result('public.my_plans()'::regprocedure) not ilike '%host_id%' and pg_get_function_result('public.my_plans()'::regprocedure) not ilike '%host_name%', 'my_plans() has no host id or name');
select pg_temp.check((select occasion from my_plans() where id = '11111111-0000-0000-0000-000000000009') = 'finals week', 'plans carry an occasion');

reset role;

-- signed-out visitors
set role anon;
select pg_temp.expect_fail($$select * from my_plans()$$, 'signed-out visitors cannot call the app functions');
select pg_temp.expect_fail($$select * from profiles$$, 'or read profiles');
select pg_temp.expect_fail($$select * from plan_signal('11111111-0000-0000-0000-000000000005')$$, 'or get a trust signal');
select pg_temp.expect_fail($$select * from preferences$$, 'or read anyone''s preferences');
reset role;
-- lists are private
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
insert into lists (id, name) values ('22222222-0000-0000-0000-000000000001', 'want to try');
insert into list_places (list_id, name, neighborhood, category) values ('22222222-0000-0000-0000-000000000001', 'Via Carota', 'west village', 'restaurant');
select pg_temp.check((select count(*) from list_places) = 1, 'Bia saves a place to her list');
select pg_temp.expect_fail($$insert into list_places (list_id, name, category) values ('22222222-0000-0000-0000-000000000001', 'x', 'casino')$$, 'only known categories');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.check((select count(*) from lists) + (select count(*) from list_places) = 0, 'Ana, her friend, sees none of it');
select pg_temp.expect_fail($$insert into list_places (list_id, name) values ('22222222-0000-0000-0000-000000000001', 'sneaky')$$, 'and cannot add to it');
update list_places set name = 'changed';
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.check((select name from list_places) = 'Via Carota', 'or change it');
reset role;
set role anon;
select pg_temp.expect_fail($$select * from lists$$, 'signed out, nothing');
reset role;

-- leaving orbi deletes everything that is yours
insert into auth.users values ('00000000-0000-0000-0000-000000000012');
set role authenticated;
select pg_temp.as_user('00000000-0000-0000-0000-000000000012'); insert into profiles (id, first_name) values (auth.uid(), 'Ivo');
select delete_me();
reset role;
select pg_temp.check((select count(*) from profiles where first_name = 'Ivo') = 0, 'Ivo leaves orbi: his profile is gone');
\echo ALL TESTS PASSED
