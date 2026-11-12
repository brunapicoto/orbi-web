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
select pg_temp.check((select string_agg(first_name, ',' order by first_name) from plan_people('11111111-0000-0000-0000-000000000001')) = 'Ana,Bia,Caio', 'at start time Bia sees who is there: Ana, Bia, Caio');
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

-- signed-out visitors
set role anon;
select pg_temp.expect_fail($$select * from my_plans()$$, 'signed-out visitors cannot call the app functions');
select pg_temp.expect_fail($$select * from profiles$$, 'or read profiles');
reset role;
\echo ALL TESTS PASSED
