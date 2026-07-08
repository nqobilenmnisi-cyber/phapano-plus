-- =====================================================================
-- Phapano+ Seed Data
-- Run ONCE in the Supabase SQL editor, AFTER schema.sql.
--
-- This script is idempotent: safe to run more than once. It seeds:
--   1. Sample South African psychology universities + programmes
--   2. Sample funding opportunities
--   3. Sample articles
--   4. A permanent demo account (demo@phapano.com / Demo123!) with
--      realistic data in every module, for the career expo.
--
-- ALL reference content below is SAMPLE DATA for demonstration. Real
-- verified content is managed through the admin portal. Dates are set
-- relative to "today" so the demo always looks current.
-- =====================================================================

-- Convenience: a few relative dates
-- (Postgres lets us use current_date + interval inline.)

-- ---------------------------------------------------------------------
-- 1. UNIVERSITIES  (sample data, published)
-- ---------------------------------------------------------------------
insert into universities (id, name, short_name, province, website_url, about, source, source_url, status, last_verified_at, next_review_due_at, owner, is_published)
values
  ('00000000-0000-0000-0000-0000000000a1', 'University of Cape Town', 'UCT', 'Western Cape', 'https://www.uct.ac.za', 'Offers Clinical and Counselling Master''s programmes with a strong research focus. Sample data for demonstration.', 'Official postgraduate page', 'https://www.uct.ac.za', 'verified', current_date - 2, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a2', 'University of the Witwatersrand', 'Wits', 'Gauteng', 'https://www.wits.ac.za', 'Clinical, Counselling and Community-based Master''s streams. Sample data for demonstration.', 'Official postgraduate page', 'https://www.wits.ac.za', 'verified', current_date - 2, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a3', 'University of Pretoria', 'UP', 'Gauteng', 'https://www.up.ac.za', 'Counselling, Clinical and Research Psychology programmes. Sample data for demonstration.', 'Official postgraduate page', 'https://www.up.ac.za', 'verified', current_date - 3, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a4', 'University of Johannesburg', 'UJ', 'Gauteng', 'https://www.uj.ac.za', 'Counselling and Community Psychology with applied training. Sample data for demonstration.', 'Official postgraduate page', 'https://www.uj.ac.za', 'verified', current_date - 3, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a5', 'Stellenbosch University', 'SU', 'Western Cape', 'https://www.sun.ac.za', 'Clinical and Research Psychology Master''s programmes. Sample data for demonstration.', 'Official postgraduate page', 'https://www.sun.ac.za', 'verified', current_date - 4, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a6', 'University of KwaZulu-Natal', 'UKZN', 'KwaZulu-Natal', 'https://www.ukzn.ac.za', 'Clinical, Counselling and Research streams. Sample data for demonstration.', 'Official postgraduate page', 'https://www.ukzn.ac.za', 'verified', current_date - 4, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a7', 'University of the Free State', 'UFS', 'Free State', 'https://www.ufs.ac.za', 'Clinical and Counselling Psychology programmes. Sample data for demonstration.', 'Official postgraduate page', 'https://www.ufs.ac.za', 'verified', current_date - 5, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000a8', 'Rhodes University', 'Rhodes', 'Eastern Cape', 'https://www.ru.ac.za', 'Clinical and Counselling Psychology with a community emphasis. Sample data for demonstration.', 'Official postgraduate page', 'https://www.ru.ac.za', 'verified', current_date - 5, current_date + 7, 'Applications', true)
on conflict (id) do update set
  name = excluded.name,
  last_verified_at = excluded.last_verified_at,
  next_review_due_at = excluded.next_review_due_at,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------
-- 2. PROGRAMMES  (two per university: clinical + counselling)
--    Closing dates spread across the next several weeks.
-- ---------------------------------------------------------------------
insert into programmes (id, university_id, stream, title, qualification, duration, overview, opening_date, closing_date, selection_week, interview_process, required_documents, minimum_requirements, referee_requirements, application_link, programme_link, source, source_url, status, last_verified_at, next_review_due_at, owner, is_published)
values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'clinical', 'MA Clinical Psychology', 'MA Clinical Psychology', '2 years (incl. internship)', 'A professional Master''s accredited for HPCSA registration. Sample data.', current_date - 20, current_date + 6, 'Mid to late August', 'Shortlisted candidates attend a selection week with interviews and group tasks.', 'Transcripts, CV, motivation letter, two academic references.', 'An Honours degree in Psychology with a strong academic record.', 'Two academic referees.', 'https://www.uct.ac.za/apply', 'https://www.uct.ac.za', 'Official programme page', 'https://www.uct.ac.za', 'verified', current_date - 2, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a1', 'counselling', 'MA Counselling Psychology', 'MA Counselling Psychology', '2 years (incl. internship)', 'A professional Master''s accredited for HPCSA registration. Sample data.', current_date - 20, current_date + 18, 'September', 'Interviews and a written task for shortlisted applicants.', 'Transcripts, CV, motivation letter, two academic references.', 'An Honours degree in Psychology.', 'Two academic referees.', 'https://www.uct.ac.za/apply', 'https://www.uct.ac.za', 'Official programme page', 'https://www.uct.ac.za', 'verified', current_date - 2, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a2', 'clinical', 'MA Clinical Psychology', 'MA Clinical Psychology', '2 years (incl. internship)', 'Professional Master''s accredited for HPCSA registration. Sample data.', current_date - 25, current_date + 9, 'August', 'Selection week including interviews and assessments.', 'Transcripts, CV, motivation letter, two references.', 'Honours in Psychology with a strong record.', 'Two academic referees.', 'https://www.wits.ac.za/apply', 'https://www.wits.ac.za', 'Official programme page', 'https://www.wits.ac.za', 'verified', current_date - 2, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000a2', 'counselling', 'MA Community-based Counselling Psychology', 'MA Counselling Psychology', '2 years', 'A community-focused professional Master''s. Sample data.', current_date - 25, current_date + 30, 'September', 'Interviews for shortlisted candidates.', 'Transcripts, CV, motivation letter, two references.', 'Honours in Psychology.', 'Two academic referees.', 'https://www.wits.ac.za/apply', 'https://www.wits.ac.za', 'Official programme page', 'https://www.wits.ac.za', 'verified', current_date - 2, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000a3', 'counselling', 'MA Counselling Psychology', 'MA Counselling Psychology', '2 years', 'Professional Master''s accredited for HPCSA registration. Sample data.', current_date - 15, current_date + 13, 'August / September', 'Interviews and group exercises.', 'Transcripts, CV, motivation letter, references.', 'Honours in Psychology.', 'Two academic referees.', 'https://www.up.ac.za/apply', 'https://www.up.ac.za', 'Official programme page', 'https://www.up.ac.za', 'verified', current_date - 3, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b6', '00000000-0000-0000-0000-0000000000a4', 'counselling', 'MA Counselling Psychology', 'MA Counselling Psychology', '2 years', 'Applied professional training. Sample data.', current_date - 15, current_date + 22, 'September', 'Selection week interviews.', 'Transcripts, CV, motivation letter, references.', 'Honours in Psychology.', 'Two academic referees.', 'https://www.uj.ac.za/apply', 'https://www.uj.ac.za', 'Official programme page', 'https://www.uj.ac.za', 'verified', current_date - 3, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b7', '00000000-0000-0000-0000-0000000000a5', 'clinical', 'MA Clinical Psychology', 'MA Clinical Psychology', '2 years (incl. internship)', 'Professional Master''s accredited for HPCSA registration. Sample data.', current_date - 18, current_date + 16, 'August', 'Interviews and assessments.', 'Transcripts, CV, motivation letter, references.', 'Honours in Psychology with a strong record.', 'Two academic referees.', 'https://www.sun.ac.za/apply', 'https://www.sun.ac.za', 'Official programme page', 'https://www.sun.ac.za', 'verified', current_date - 4, current_date + 7, 'Applications', true),
  ('00000000-0000-0000-0000-0000000000b8', '00000000-0000-0000-0000-0000000000a6', 'research', 'MSocSc Research Psychology', 'MSocSc Research Psychology', '1-2 years', 'A research-oriented Master''s. Sample data.', current_date - 18, current_date + 40, 'October', 'Application review and interview.', 'Transcripts, CV, research proposal, references.', 'Honours in Psychology.', 'Two academic referees.', 'https://www.ukzn.ac.za/apply', 'https://www.ukzn.ac.za', 'Official programme page', 'https://www.ukzn.ac.za', 'verified', current_date - 4, current_date + 7, 'Applications', true)
on conflict (id) do update set
  closing_date = excluded.closing_date,
  last_verified_at = excluded.last_verified_at,
  next_review_due_at = excluded.next_review_due_at,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------
-- 3. FUNDING  (sample data, published)
-- ---------------------------------------------------------------------
insert into funding_opportunities (id, title, provider, type, amount_description, eligibility, description, closing_date, link, relevant_streams, relevant_stages, source, source_url, status, last_verified_at, next_review_due_at, owner, is_published)
values
  ('00000000-0000-0000-0000-0000000000c1', 'NRF Postgraduate Scholarship', 'National Research Foundation', 'scholarship', 'Full cost of study', 'South African citizens with a strong academic record pursuing a Master''s.', 'A national scholarship supporting postgraduate study. Sample data for demonstration.', current_date + 12, 'https://www.nrf.ac.za', array['clinical','counselling','research']::psychology_stream[], array['masters_applicant','masters_student']::career_stage[], 'Official funding provider', 'https://www.nrf.ac.za', 'verified', current_date - 3, current_date + 7, 'Funding', true),
  ('00000000-0000-0000-0000-0000000000c2', 'NSFAS Postgraduate Support', 'NSFAS', 'bursary', 'Tuition and allowance', 'Students from households meeting the means test.', 'Government financial aid for qualifying students. Sample data for demonstration.', current_date + 30, 'https://www.nsfas.org.za', array['clinical','counselling','research','educational']::psychology_stream[], array['honours','masters_applicant']::career_stage[], 'Official funding provider', 'https://www.nsfas.org.za', 'verified', current_date - 4, current_date + 7, 'Funding', true),
  ('00000000-0000-0000-0000-0000000000c3', 'FirstRand Foundation Bursary', 'FirstRand Foundation', 'bursary', 'Tuition + stipend', 'Postgraduate students in priority fields including psychology.', 'A bursary for postgraduate students. Sample data for demonstration.', current_date + 21, 'https://www.firstrand.co.za', array['clinical','counselling']::psychology_stream[], array['masters_applicant','masters_student']::career_stage[], 'Official funding provider', 'https://www.firstrand.co.za', 'verified', current_date - 2, current_date + 7, 'Funding', true),
  ('00000000-0000-0000-0000-0000000000c4', 'Psychology Conference Travel Grant', 'PsySSA', 'travel_grant', 'Up to R8,000', 'Master''s students presenting research at an accredited conference.', 'Supports travel to present research. Sample data for demonstration.', current_date + 45, 'https://www.psyssa.com', array['research']::psychology_stream[], array['masters_student']::career_stage[], 'Official funding provider', 'https://www.psyssa.com', 'verified', current_date - 5, current_date + 7, 'Funding', true),
  ('00000000-0000-0000-0000-0000000000c5', 'Mental Health Research Grant', 'SAMRC', 'research_funding', 'Project-based', 'Research-focused Master''s students in mental health.', 'Funds mental-health research projects. Sample data for demonstration.', current_date + 60, 'https://www.samrc.ac.za', array['research','clinical']::psychology_stream[], array['masters_student']::career_stage[], 'Official funding provider', 'https://www.samrc.ac.za', 'verified', current_date - 3, current_date + 7, 'Funding', true)
on conflict (id) do update set
  closing_date = excluded.closing_date,
  last_verified_at = excluded.last_verified_at,
  next_review_due_at = excluded.next_review_due_at,
  is_published = excluded.is_published;

-- ---------------------------------------------------------------------
-- 4. ARTICLES  (sample data, published)
-- ---------------------------------------------------------------------
insert into articles (id, title, slug, excerpt, body, category, reading_minutes, source, status, last_verified_at, next_review_due_at, owner, is_published, published_at)
values
  ('00000000-0000-0000-0000-0000000000d1', 'How selection week actually works', 'how-selection-week-works', 'A clear, calm guide to what happens after you submit, written for first-time applicants.', 'Selection week can feel mysterious. This guide walks through what to expect, how to prepare, and how to look after yourself through it. Sample content for demonstration.', 'Applications', 6, 'Phapano editorial', 'verified', current_date - 10, current_date + 355, 'Articles', true, now()),
  ('00000000-0000-0000-0000-0000000000d2', 'Writing a motivation letter that sounds like you', 'motivation-letter-guide', 'Practical, honest advice for a letter that reflects who you really are.', 'Your motivation letter is not a performance. This guide helps you write something true. Sample content for demonstration.', 'Applications', 5, 'Phapano editorial', 'verified', current_date - 10, current_date + 355, 'Articles', true, now()),
  ('00000000-0000-0000-0000-0000000000d3', 'Funding your Master''s: where to actually look', 'funding-your-masters', 'The funding landscape in South Africa, mapped into one place.', 'Funding is scattered. This guide brings the main sources together. Sample content for demonstration.', 'Funding', 7, 'Phapano editorial', 'verified', current_date - 10, current_date + 355, 'Articles', true, now()),
  ('00000000-0000-0000-0000-0000000000d4', 'Looking after yourself during applications', 'wellbeing-during-applications', 'The application season is hard. A few gentle reminders for staying well.', 'This is a demanding stretch. Here are some grounded ways to look after your wellbeing. Sample content for demonstration.', 'Wellbeing', 4, 'Phapano editorial', 'verified', current_date - 10, current_date + 355, 'Articles', true, now())
on conflict (id) do update set
  last_verified_at = excluded.last_verified_at,
  is_published = excluded.is_published;

-- =====================================================================
-- 5. DEMO ACCOUNT  (demo@phapano.com / Demo123!)
--    Created here so the career-expo demo always has data everywhere.
--    Requires running with the service role (Supabase SQL editor does).
-- =====================================================================
do $$
declare
  demo_id uuid;
  app_id  uuid := '00000000-0000-0000-0000-0000000000e1';
begin
  -- Find existing demo user, or create one.
  select id into demo_id from auth.users where email = 'demo@phapano.com';

  if demo_id is null then
    demo_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    )
    values (
      '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
      'demo@phapano.com', crypt('Demo123!', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Lerato Mokoena"}'::jsonb,
      '', '', '', ''
    );

    -- Identities row (required for email login in modern GoTrue).
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    )
    values (
      gen_random_uuid(), demo_id,
      format('{"sub":"%s","email":"demo@phapano.com"}', demo_id)::jsonb,
      'email', demo_id::text, now(), now(), now()
    );
  end if;

  -- Profile (the trigger may have created one; upsert to enrich it).
  insert into profiles (id, full_name, email, role, career_stage, university, province, interests, bio, onboarding_complete, founding_member)
  values (
    demo_id, 'Lerato Mokoena', 'demo@phapano.com', 'student', 'masters_applicant',
    'University of Cape Town', 'Western Cape',
    array['clinical','counselling']::psychology_stream[],
    'Honours graduate applying for clinical Master''s programmes. (Demo account.)',
    true, true
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    career_stage = excluded.career_stage,
    university = excluded.university,
    province = excluded.province,
    interests = excluded.interests,
    onboarding_complete = true,
    founding_member = true;

  -- Saved universities
  insert into saved_universities (user_id, university_id)
  values
    (demo_id, '00000000-0000-0000-0000-0000000000a1'),
    (demo_id, '00000000-0000-0000-0000-0000000000a2')
  on conflict (user_id, university_id) do nothing;

  -- Saved funding
  insert into saved_funding (user_id, funding_id)
  values
    (demo_id, '00000000-0000-0000-0000-0000000000c1'),
    (demo_id, '00000000-0000-0000-0000-0000000000c3')
  on conflict (user_id, funding_id) do nothing;

  -- An in-progress application with a partly-complete checklist
  insert into applications (id, user_id, university_id, programme_id, university_label, programme_label, stage, checklist, notes)
  values (
    app_id, demo_id,
    '00000000-0000-0000-0000-0000000000a2',
    '00000000-0000-0000-0000-0000000000b3',
    'Wits', 'MA Clinical Psychology', 'documents',
    '[{"label":"Confirm you meet the minimum requirements","done":true},
      {"label":"Gather academic transcripts","done":true},
      {"label":"Prepare your CV","done":true},
      {"label":"Write your motivation letter","done":false},
      {"label":"Secure two referees","done":false},
      {"label":"Submit the application","done":false}]'::jsonb,
    'Demo application.'
  )
  on conflict (id) do update set stage = excluded.stage, checklist = excluded.checklist;

  -- Journal entries (private to the demo user) + a mood
  insert into journal_entries (user_id, content, prompt, mood, created_at)
  values
    (demo_id, 'I keep coming back to how much I want to help people who feel unheard. That is why I am doing this.', 'What drew you to psychology in the first place?', 'hopeful', now() - interval '2 days'),
    (demo_id, 'Submitted the transcript request today. Small step, but it counts.', 'What is one small thing that went well today?', 'calm', now() - interval '1 day')
  on conflict do nothing;

  -- Notifications
  insert into notifications (user_id, type, title, body, link, read, created_at)
  values
    (demo_id, 'deadline', 'Wits MA Clinical closes soon', 'Your saved application deadline is approaching.', '/app/apply', false, now()),
    (demo_id, 'funding', 'New funding that fits you', 'NRF Postgraduate Scholarship matches your stage and interests.', '/app/funding', false, now() - interval '1 day'),
    (demo_id, 'system', 'Welcome to Phapano+', 'Your journey starts here.', '/dashboard', true, now() - interval '3 days')
  on conflict do nothing;
end $$;

-- Done. Sign in with demo@phapano.com / Demo123!
