-- =====================================================================
-- Migration 0011 — Funding directory: level categories + expanded seed.
-- SAFE & RE-RUNNABLE (add column if not exists / update / on conflict do
-- nothing / delete by slug). Requires 0010.
--
-- DATA INTEGRITY: every funder below is real and psychology-eligible; official
-- pages were confirmed on the funders' own sites. Discipline-restricted funding
-- (STEM-only, commerce-only, etc.) is excluded. Closing dates are left NULL.
-- =====================================================================

-- 1) Category tags drive the browsing sections/filters on the Funding page.
--    Tokens: undergraduate | honours | masters | doctoral | postdoctoral |
--            research_grant | conference_travel
alter table public.funding_opportunities add column if not exists categories text[] not null default '{}';

-- 2) Remove PsySSA opportunities.
delete from public.funding_opportunities where slug = 'psyssa';

-- 3) Tag existing funders.
update public.funding_opportunities set categories = '{honours}'            where slug = 'nrf-honours';
update public.funding_opportunities set categories = '{masters,doctoral}'   where slug = 'nrf-masters-doctoral';
update public.funding_opportunities set categories = '{masters,doctoral}'   where slug = 'nihss';
update public.funding_opportunities set categories = '{masters,doctoral,research_grant}' where slug = 'samrc';
update public.funding_opportunities set categories = '{honours,masters}'    where slug = 'mandela-rhodes';
update public.funding_opportunities set categories = '{masters,doctoral}'   where slug = 'canon-collins';
update public.funding_opportunities set categories = '{masters,doctoral}'   where slug = 'omt';
update public.funding_opportunities set categories = '{undergraduate,honours}' where slug = 'funza-lushaka';

-- 4) Expand with more verified, psychology-eligible funders across levels.
insert into public.funding_opportunities
  (slug, title, provider, type, level, field_relevance, description,
   link, source, source_url, categories, is_open, is_published, last_verified_at)
values
  ('nsfas',
   'NSFAS Bursary',
   'National Student Financial Aid Scheme (NSFAS)', 'bursary',
   'Undergraduate', 'All qualifying undergraduate programmes (incl. Psychology)',
   'Government financial aid covering tuition and allowances for undergraduate students from low-income households at public universities and TVET colleges.',
   'https://www.nsfas.org.za/', 'NSFAS', 'https://www.nsfas.org.za/',
   '{undergraduate}', true, true, current_date),

  ('skye-foundation',
   'Skye Foundation Postgraduate Scholarships',
   'Skye Foundation', 'scholarship',
   'Master''s · Doctoral', 'Any field (incl. Psychology)',
   'Merit scholarships for outstanding South African postgraduates in any discipline; candidates are nominated by their faculty deans.',
   'http://skyefoundation.co.za/', 'Skye Foundation', 'http://skyefoundation.co.za/',
   '{masters,doctoral}', true, true, current_date),

  ('chevening',
   'Chevening Scholarships',
   'Chevening (UK Government)', 'scholarship',
   'Master''s', 'Any field (incl. Psychology)',
   'Fully-funded UK government scholarships for a one-year master''s degree in the United Kingdom, open to all fields of study.',
   'https://www.chevening.org/', 'Chevening', 'https://www.chevening.org/',
   '{masters}', true, true, current_date),

  ('commonwealth',
   'Commonwealth Scholarships',
   'Commonwealth Scholarship Commission (UK)', 'scholarship',
   'Master''s · Doctoral', 'Incl. Social Sciences & Humanities',
   'Scholarships for master''s and doctoral study in the UK for candidates from Commonwealth countries, including social sciences.',
   'https://cscuk.fcdo.gov.uk/', 'Commonwealth Scholarship Commission', 'https://cscuk.fcdo.gov.uk/',
   '{masters,doctoral}', true, true, current_date),

  ('fulbright-foreign-student',
   'Fulbright Foreign Student Program',
   'US Embassy South Africa (Fulbright)', 'scholarship',
   'Master''s · Doctoral', 'Any field (incl. Psychology)',
   'Funding for South African citizens to pursue a master''s or doctoral degree in the United States; awarded for two years towards one degree.',
   'https://za.usembassy.gov/fulbright-foreign-student-program/', 'US Embassy South Africa',
   'https://za.usembassy.gov/fulbright-foreign-student-program/',
   '{masters,doctoral}', true, true, current_date),

  ('nrf-postdoc',
   'NRF Postdoctoral Fellowships',
   'National Research Foundation (NRF)', 'research_funding',
   'Postdoctoral', 'Social Sciences & Humanities (incl. Psychology)',
   'Fellowships supporting early-career researchers to conduct postdoctoral research, including in the social sciences and humanities.',
   'https://www.nrf.ac.za/', 'National Research Foundation', 'https://www.nrf.ac.za/',
   '{postdoctoral}', true, true, current_date),

  ('nrf-kic',
   'NRF Knowledge, Interchange & Collaboration (KIC)',
   'National Research Foundation (NRF)', 'conference_funding',
   'Postgraduate / researcher', 'All fields (incl. Psychology)',
   'Grants supporting travel to present at conferences, and hosting of scientific events and research visits.',
   'https://www.nrf.ac.za/', 'National Research Foundation', 'https://www.nrf.ac.za/',
   '{conference_travel}', true, true, current_date),

  ('codesria',
   'CODESRIA Research & Thesis Grants',
   'Council for the Development of Social Science Research in Africa (CODESRIA)', 'research_funding',
   'Master''s · Doctoral', 'Social Sciences & Humanities',
   'Small grants and support for African social science research, including thesis-writing and fieldwork support.',
   'https://www.codesria.org/', 'CODESRIA', 'https://www.codesria.org/',
   '{research_grant,masters,doctoral}', true, true, current_date)
on conflict (slug) do nothing;

-- Ensure any new-but-existing rows also carry categories (idempotent top-ups).
update public.funding_opportunities set categories = '{undergraduate}'        where slug = 'nsfas' and categories = '{}';
update public.funding_opportunities set categories = '{masters,doctoral}'      where slug = 'skye-foundation' and categories = '{}';
update public.funding_opportunities set categories = '{masters}'               where slug = 'chevening' and categories = '{}';
update public.funding_opportunities set categories = '{masters,doctoral}'      where slug = 'commonwealth' and categories = '{}';
update public.funding_opportunities set categories = '{masters,doctoral}'      where slug = 'fulbright-foreign-student' and categories = '{}';
update public.funding_opportunities set categories = '{postdoctoral}'          where slug = 'nrf-postdoc' and categories = '{}';
update public.funding_opportunities set categories = '{conference_travel}'     where slug = 'nrf-kic' and categories = '{}';
update public.funding_opportunities set categories = '{research_grant,masters,doctoral}' where slug = 'codesria' and categories = '{}';

-- Done.
