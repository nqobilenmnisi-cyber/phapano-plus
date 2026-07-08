-- =====================================================================
-- Migration 0008 — Apply planning platform: richer personal planner,
-- verified official links/deadlines, and a more complete directory.
--
-- SAFE & NON-DESTRUCTIVE (add column if not exists / on conflict do nothing /
-- targeted updates by slug). Re-runnable. Requires 0005–0007.
--
-- DATA INTEGRITY: closing_date + official URLs below were confirmed on official
-- university (.ac.za) pages. Everything not confirmed stays NULL, so the card
-- shows the single clean fallback "Deadline not yet available". No dates or
-- links are invented.
-- =====================================================================

-- 1) Personal planner: extra fields (per-user, private).
alter table public.saved_programmes add column if not exists personal_statement_done boolean not null default false;
alter table public.saved_programmes add column if not exists cv_done boolean not null default false;
alter table public.saved_programmes add column if not exists transcript_uploaded boolean not null default false;

-- 2) Fill directory gaps — additional officially-offered streams / institutions.
--    (New slugs only; on conflict do nothing keeps this idempotent.)
insert into public.programmes (slug, institution, institution_url, province, qualification, stream)
values
  -- Wits also offers Counselling (Community-Based), Educational, Organisational
  ('wits-masters-counselling', 'University of the Witwatersrand', 'https://www.wits.ac.za', 'Gauteng',      'masters', 'counselling'),
  ('wits-masters-educational', 'University of the Witwatersrand', 'https://www.wits.ac.za', 'Gauteng',      'masters', 'educational'),
  ('wits-masters-io',          'University of the Witwatersrand', 'https://www.wits.ac.za', 'Gauteng',      'masters', 'industrial_organisational'),
  -- UCT also offers Research and Industrial/Organisational
  ('uct-masters-research',     'University of Cape Town',         'https://www.uct.ac.za',  'Western Cape', 'masters', 'research'),
  ('uct-masters-io',           'University of Cape Town',         'https://www.uct.ac.za',  'Western Cape', 'masters', 'industrial_organisational'),
  -- Rhodes also offers Counselling
  ('ru-masters-counselling',   'Rhodes University',               'https://www.ru.ac.za',   'Eastern Cape', 'masters', 'counselling'),
  -- UKZN also offers Research
  ('ukzn-masters-research',    'University of KwaZulu-Natal',     'https://www.ukzn.ac.za', 'KwaZulu-Natal','masters', 'research'),
  -- UWC also offers Industrial/Organisational and Research
  ('uwc-masters-io',           'University of the Western Cape',  'https://www.uwc.ac.za',  'Western Cape', 'masters', 'industrial_organisational'),
  ('uwc-masters-research',     'University of the Western Cape',  'https://www.uwc.ac.za',  'Western Cape', 'masters', 'research'),
  -- NWU also offers Research
  ('nwu-masters-research',     'North-West University',           'https://www.nwu.ac.za',  'North West',   'masters', 'research')
on conflict (slug) do nothing;

-- Additional Honours-offering institutions.
insert into public.programmes (slug, institution, institution_url, province, qualification)
values
  ('smu-honours', 'Sefako Makgatho Health Sciences University', 'https://www.smu.ac.za', 'Gauteng',       'honours'),
  ('wsu-honours', 'Walter Sisulu University',                   'https://www.wsu.ac.za', 'Eastern Cape',  'honours'),
  ('ump-honours', 'University of Mpumalanga',                   'https://www.ump.ac.za', 'Mpumalanga',    'honours')
on conflict (slug) do nothing;

-- 3) Enrich with VERIFIED official department / programme / application URLs.
--    (Only user-facing official university links — no third-party sources.)

-- Wits — department + central applications
update public.programmes set
  department_url = 'https://www.wits.ac.za/shcd/psychology/',
  application_link = 'https://www.wits.ac.za/applications/'
where slug like 'wits-%';

update public.programmes set programme_url = 'https://www.wits.ac.za/shcd/psychology/academic-programmes/masters/master-of-arts-in-clinical-psychology/' where slug = 'wits-masters-clinical';
update public.programmes set programme_url = 'https://www.wits.ac.za/shcd/psychology/academic-programmes/masters/masters-of-arts-in-community-based-counselling/' where slug = 'wits-masters-counselling';
update public.programmes set programme_url = 'https://www.wits.ac.za/shcd/psychology/academic-programmes/masters/master-of-education-in-educational-psychology/' where slug = 'wits-masters-educational';
update public.programmes set programme_url = 'https://www.wits.ac.za/shcd/psychology/academic-programmes/masters/' where slug in ('wits-masters-research','wits-masters-io');

-- University of Pretoria — department + programme + online application
update public.programmes set
  department_url = 'https://www.up.ac.za/psychology',
  programme_url = 'https://www.up.ac.za/psychology/professional-masters-psychology-programme-information-application-process',
  application_link = 'https://www.up.ac.za/online-application'
where slug like 'up-masters-%';
update public.programmes set department_url = 'https://www.up.ac.za/psychology', application_link = 'https://www.up.ac.za/online-application' where slug = 'up-honours';

-- Rhodes — department + programme pages
update public.programmes set department_url = 'https://www.ru.ac.za/psychology/' where slug like 'ru-%';
update public.programmes set programme_url = 'https://www.ru.ac.za/psychology/courses/mastersinclinicalpsychology/' where slug = 'ru-masters-clinical';
update public.programmes set programme_url = 'https://www.ru.ac.za/psychology/courses/mastersincounsellingpsychology/' where slug = 'ru-masters-counselling';

-- 4) VERIFIED official closing dates (2027 intake), confirmed on .ac.za pages.
update public.programmes set closing_date = '2026-05-31' where slug in ('up-masters-clinical','up-masters-counselling','up-masters-research');
update public.programmes set closing_date = '2026-05-01' where slug = 'wits-masters-clinical';
update public.programmes set closing_date = '2026-05-29' where slug = 'wits-masters-educational';

-- Done.
