-- =====================================================================
-- COMMUNITY LITE — LIVE RLS VERIFICATION (v2)
-- Run in the Supabase SQL editor AFTER migrations 0013 and 0014.
--
-- WHAT IT DOES
--   Creates four throw-away accounts (User A, User B, User C, Admin),
--   seeds community data, then impersonates each account exactly the way
--   PostgREST does (role=authenticated + request.jwt.claims) and checks
--   the security assumptions LIVE against your policies.
--
-- HOW TO READ THE OUTPUT
--   Open the "Messages"/"Results" panel. Every check prints
--   "CHECK n ... : PASS" or ": FAIL". The last lines are a summary.
--
--   >>> IF ANY CHECK PRINTS FAIL: STOP. Do not merge and do not invite
--   >>> testers. Copy the full output and send it to Claude. A FAIL on
--   >>> checks 1, 3, 4, 6 or 7 is a privacy or admin-control breach.
--
-- SAFETY: everything runs in one transaction and is ROLLED BACK at the
-- end. Nothing persists — not even the throw-away accounts.
-- =====================================================================
begin;

do $$
declare
  usr_a uuid := gen_random_uuid();  -- ordinary member (reporter, blocker)
  usr_b uuid := gen_random_uuid();  -- posts content; gets reported/blocked
  usr_c uuid := gen_random_uuid();  -- bystander (third-party privacy)
  adm   uuid := gen_random_uuid();  -- admin
  post_b uuid; post_removed uuid; comment_b uuid;
  n int; fails int := 0; total int := 0;
begin
  -- ---------- seed (as table owner; bypasses RLS) ----------
  insert into auth.users (id, email) values
    (usr_a, 'rls-a@test.invalid'), (usr_b, 'rls-b@test.invalid'),
    (usr_c, 'rls-c@test.invalid'), (adm,   'rls-admin@test.invalid');

  -- Passport rows may be auto-created by a signup trigger; make admin an
  -- admin and ensure rows exist either way.
  insert into public.profiles (id, role) values (adm, 'admin')
    on conflict (id) do update set role = 'admin';
  insert into public.profiles (id) values (usr_a), (usr_b), (usr_c)
    on conflict (id) do nothing;

  insert into public.community_profiles (user_id, display_name, visibility) values
    (usr_a, 'RLS Test A', 'visible'),
    (usr_b, 'RLS Test B', 'visible'),
    (usr_c, 'RLS Test C', 'visible'),
    (adm,   'RLS Admin',  'visible');

  -- B has accepted the guidelines; A and C have NOT.
  insert into public.community_terms_acceptances (user_id, document_type, document_version)
    values (usr_b, 'community_guidelines', '2026-07-v1');

  insert into public.community_posts (author_id, body)
    values (usr_b, 'Published post by B') returning id into post_b;
  insert into public.community_posts (author_id, body, status)
    values (usr_b, 'Removed post by B', 'removed') returning id into post_removed;
  insert into public.community_comments (post_id, author_id, body)
    values (post_b, usr_b, 'Comment by B') returning id into comment_b;

  -- C follows B, and A follows B (the A->B follow must be severed by blocking).
  insert into public.community_follows (follower_id, followee_id)
    values (usr_c, usr_b), (usr_a, usr_b);

  -- A reports B's post (seeded as owner so we control the exact row).
  insert into public.community_reports
    (reporter_id, target_type, target_post_id, target_user_id, category, content_excerpt)
    values (usr_a, 'post', post_b, usr_b, 'spam', 'Published post by B');

  -- One moderation log entry exists.
  insert into public.community_moderation_actions (admin_id, target_user_id, action, notes)
    values (adm, usr_b, 'note', 'seed audit row');

  -- =================================================================
  -- CHECK 1 — Passport privacy: A cannot read B's private Passport row.
  -- =================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_a, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.profiles where id = usr_b;
  if n = 0 then raise notice 'CHECK 1  Passport not readable across accounts: PASS';
  else fails := fails + 1; raise notice 'CHECK 1  Passport not readable across accounts: FAIL (% row(s) visible)', n; end if;

  -- =================================================================
  -- CHECK 2 — Guidelines gate: A (no acceptance) cannot insert a post.
  -- =================================================================
  total := total + 1;
  begin
    insert into public.community_posts (author_id, body) values (usr_a, 'should fail');
    fails := fails + 1; raise notice 'CHECK 2  Posting blocked before accepting guidelines: FAIL';
  exception when others then
    raise notice 'CHECK 2  Posting blocked before accepting guidelines: PASS';
  end;

  -- =================================================================
  -- CHECK 3 — Moderation flags: an ordinary user cannot write them.
  -- =================================================================
  total := total + 1;
  begin
    insert into public.community_moderation_state (user_id, posting_restricted)
      values (usr_a, false);
    fails := fails + 1; raise notice 'CHECK 3  Users cannot write moderation flags: FAIL';
  exception when others then
    raise notice 'CHECK 3  Users cannot write moderation flags: PASS';
  end;

  -- =================================================================
  -- CHECKS 4-5 — Report privacy.
  -- =================================================================
  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_b, 'role', 'authenticated')::text, true);
  select count(*) into n from public.community_reports;                -- B: reported user
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_c, 'role', 'authenticated')::text, true);
  select n + count(*) into n from public.community_reports;            -- C: bystander
  if n = 0 then raise notice 'CHECK 4  Reports hidden from reported user and bystanders: PASS';
  else fails := fails + 1; raise notice 'CHECK 4  Reports hidden from reported user and bystanders: FAIL'; end if;

  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.community_reports where reporter_id = usr_a;
  if n = 1 then raise notice 'CHECK 5  Reporter can still see their own report: PASS';
  else fails := fails + 1; raise notice 'CHECK 5  Reporter can still see their own report: FAIL'; end if;

  -- =================================================================
  -- CHECKS 6-7 — Moderation log: hidden from users, visible to admin.
  -- =================================================================
  total := total + 1;
  select count(*) into n from public.community_moderation_actions;
  if n = 0 then raise notice 'CHECK 6  Moderation log hidden from users: PASS';
  else fails := fails + 1; raise notice 'CHECK 6  Moderation log hidden from users: FAIL'; end if;

  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  select count(*) into n from public.community_moderation_actions;
  select n + count(*) into n from public.community_reports;
  if n >= 2 then raise notice 'CHECK 7  Admin can read reports and moderation log: PASS';
  else fails := fails + 1; raise notice 'CHECK 7  Admin can read reports and moderation log: FAIL'; end if;

  -- =================================================================
  -- CHECK 8 — Follower privacy: A (not a participant) cannot see that
  --            C follows B, but the public count function still works.
  -- =================================================================
  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_a, 'role', 'authenticated')::text, true);
  select count(*) into n from public.community_follows
    where follower_id = usr_c and followee_id = usr_b;
  if n = 0 and (select followers from public.community_follow_counts(usr_b)) = 2 then
    raise notice 'CHECK 8  Follower identities private, counts public: PASS';
  else
    fails := fails + 1; raise notice 'CHECK 8  Follower identities private, counts public: FAIL';
  end if;

  -- =================================================================
  -- CHECKS 9-10 — Removed content: hidden from users, restorable by admin.
  -- =================================================================
  total := total + 1;
  select count(*) into n from public.community_posts where id = post_removed;
  if n = 0 then raise notice 'CHECK 9  Removed content hidden from ordinary users: PASS';
  else fails := fails + 1; raise notice 'CHECK 9  Removed content hidden from ordinary users: FAIL'; end if;

  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  select count(*) into n from public.community_posts where id = post_removed;
  if n = 1 then raise notice 'CHECK 10 Removed content visible to admin (restorable): PASS';
  else fails := fails + 1; raise notice 'CHECK 10 Removed content visible to admin (restorable): FAIL'; end if;

  -- =================================================================
  -- CHECKS 11-13 — Restriction and suspension enforced at the database.
  -- =================================================================
  perform set_config('role', 'postgres', true);
  insert into public.community_moderation_state (user_id, posting_restricted)
    values (usr_b, true)
    on conflict (user_id) do update set posting_restricted = true;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_b, 'role', 'authenticated')::text, true);

  total := total + 1;
  begin
    insert into public.community_posts (author_id, body) values (usr_b, 'restricted');
    fails := fails + 1; raise notice 'CHECK 11 Restricted user cannot post: FAIL';
  exception when others then
    raise notice 'CHECK 11 Restricted user cannot post: PASS';
  end;

  total := total + 1;
  begin
    insert into public.community_comments (post_id, author_id, body)
      values (post_b, usr_b, 'restricted comment');
    fails := fails + 1; raise notice 'CHECK 12 Restricted user cannot comment: FAIL';
  exception when others then
    raise notice 'CHECK 12 Restricted user cannot comment: PASS';
  end;

  perform set_config('role', 'postgres', true);
  update public.community_moderation_state
    set posting_restricted = false, community_suspended = true
    where user_id = usr_b;
  perform set_config('role', 'authenticated', true);

  total := total + 1;
  begin
    insert into public.community_posts (author_id, body) values (usr_b, 'suspended');
    fails := fails + 1; raise notice 'CHECK 13 Suspended user cannot post: FAIL';
  exception when others then
    raise notice 'CHECK 13 Suspended user cannot post: PASS';
  end;

  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_c, 'role', 'authenticated')::text, true);
  select count(*) into n from public.community_profiles where user_id = usr_b;
  if n = 0 then raise notice 'CHECK 14 Suspended profile hidden from members: PASS';
  else fails := fails + 1; raise notice 'CHECK 14 Suspended profile hidden from members: FAIL'; end if;

  perform set_config('role', 'postgres', true);
  update public.community_moderation_state
    set community_suspended = false where user_id = usr_b;

  -- =================================================================
  -- CHECKS 15-20 — Blocking (run LAST: it poisons A<->B visibility).
  --                A blocks B through the real function, acting as A.
  -- =================================================================
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_a, 'role', 'authenticated')::text, true);
  perform public.community_block_user(usr_b);

  total := total + 1;
  select count(*) into n from public.community_posts where id = post_b;
  if n = 0 then raise notice 'CHECK 15 Blocker no longer sees blocked user''s posts: PASS';
  else fails := fails + 1; raise notice 'CHECK 15 Blocker no longer sees blocked user''s posts: FAIL'; end if;

  total := total + 1;
  select count(*) into n from public.community_comments where id = comment_b;
  if n = 0 then raise notice 'CHECK 16 Blocker no longer sees blocked user''s comments: PASS';
  else fails := fails + 1; raise notice 'CHECK 16 Blocker no longer sees blocked user''s comments: FAIL'; end if;

  total := total + 1;
  select count(*) into n from public.community_profiles where user_id = usr_b;
  if n = 1 then raise notice 'CHECK 17 Blocker still sees blocked profile (Settings list): PASS';
  else fails := fails + 1; raise notice 'CHECK 17 Blocker still sees blocked profile (Settings list): FAIL'; end if;

  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_b, 'role', 'authenticated')::text, true);

  total := total + 1;
  select count(*) into n from public.community_profiles where user_id = usr_a;
  if n = 0 then raise notice 'CHECK 18 Blocked user cannot see blocker''s profile: PASS';
  else fails := fails + 1; raise notice 'CHECK 18 Blocked user cannot see blocker''s profile: FAIL'; end if;

  total := total + 1;
  begin
    insert into public.community_follows (follower_id, followee_id) values (usr_b, usr_a);
    fails := fails + 1; raise notice 'CHECK 19 Blocked user cannot follow the blocker: FAIL';
  exception when others then
    raise notice 'CHECK 19 Blocked user cannot follow the blocker: PASS';
  end;

  total := total + 1;
  perform set_config('role', 'postgres', true);
  select count(*) into n from public.community_follows
    where (follower_id = usr_a and followee_id = usr_b)
       or (follower_id = usr_b and followee_id = usr_a);
  if n = 0 then raise notice 'CHECK 20 Blocking severed the existing A->B follow: PASS';
  else fails := fails + 1; raise notice 'CHECK 20 Blocking severed the existing A->B follow: FAIL'; end if;


  -- =================================================================
  -- CHECK 21 — Self-read moderation state (0015): B can read its OWN
  --            restriction flag (so the UI can show a message), but not
  --            another user's.
  -- =================================================================
  perform set_config('role', 'postgres', true);
  insert into public.community_moderation_state (user_id, posting_restricted)
    values (usr_b, true)
    on conflict (user_id) do update set posting_restricted = true;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_b, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.community_moderation_state where user_id = usr_b;
  if n = 1 then raise notice 'CHECK 21 User can read own moderation state: PASS';
  else fails := fails + 1; raise notice 'CHECK 21 User can read own moderation state: FAIL'; end if;

  total := total + 1;
  select count(*) into n from public.community_moderation_state where user_id = usr_a;
  if n = 0 then raise notice 'CHECK 22 User cannot read another''s moderation state: PASS';
  else fails := fails + 1; raise notice 'CHECK 22 User cannot read another''s moderation state: FAIL'; end if;
  perform set_config('role', 'postgres', true);
  update public.community_moderation_state set posting_restricted = false where user_id = usr_b;

  -- =================================================================
  -- CHECK 23 — Contact messages (0015): a normal user cannot READ them.
  -- =================================================================
  insert into public.contact_messages (name, email, category, message)
    values ('Seed', 'seed@test.invalid', 'Ask a question', 'Hello there team');
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', usr_a, 'role', 'authenticated')::text, true);
  total := total + 1;
  select count(*) into n from public.contact_messages;
  if n = 0 then raise notice 'CHECK 23 Contact messages hidden from ordinary users: PASS';
  else fails := fails + 1; raise notice 'CHECK 23 Contact messages hidden from ordinary users: FAIL'; end if;

  total := total + 1;
  perform set_config('request.jwt.claims',
    json_build_object('sub', adm, 'role', 'authenticated')::text, true);
  select count(*) into n from public.contact_messages;
  if n >= 1 then raise notice 'CHECK 24 Admin can read contact messages: PASS';
  else fails := fails + 1; raise notice 'CHECK 24 Admin can read contact messages: FAIL'; end if;

  -- ---------- summary ----------
  raise notice '=====================================================';
  if fails = 0 then
    raise notice 'ALL % CHECKS PASSED — safe to continue to app testing.', total;
  else
    raise notice '% OF % CHECKS FAILED — STOP. Do not merge or invite testers.', fails, total;
    raise notice 'Copy this full output and send it to Claude.';
  end if;
  raise notice '=====================================================';
end $$;

rollback;
