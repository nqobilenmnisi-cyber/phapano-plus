-- =====================================================================
-- Migration 0010 — Funding: psychology-relevant funding hub.
-- SAFE & NON-DESTRUCTIVE (add column if not exists / on conflict do nothing).
--
-- DATA INTEGRITY: funders below are real, well-established SA funders whose
-- programmes are relevant to psychology postgraduates. Official pages were
-- confirmed on the funders' own sites. Closing dates are intentionally left
-- NULL (they vary by cycle/institution) rather than invented. Eligibility
-- summaries are general; the official page is the source of truth.
-- =====================================================================

alter table public.funding_opportunities add column if not exists slug text;
alter table public.funding_opportunities add column if not exists level text;             -- e.g. "Honours · Master's · PhD"
alter table public.funding_opportunities add column if not exists field_relevance text;    -- e.g. "Social Sciences & Humanities"
alter table public.funding_opportunities add column if not exists is_open boolean not null default true;
alter table public.funding_opportunities add column if not exists featured boolean not null default false;

create unique index if not exists uq_funding_slug on public.funding_opportunities(slug) where slug is not null;

insert into public.funding_opportunities
  (slug, title, provider, type, level, field_relevance, eligibility, description,
   link, source, source_url, is_open, featured, is_published, last_verified_at)
values
  ('nrf-honours',
   'DSI-NRF Postgraduate Scholarship — Honours',
   'National Research Foundation (NRF)', 'scholarship',
   'Honours', 'Social Sciences & Humanities (incl. Psychology)',
   'SA citizens & permanent residents; minimum 65% in the previous degree. Supports Honours study across Social Sciences and Humanities. Applications are made via the NRF Connect system.',
   'Full or partial cost of study for Honours students; part of the DSI-NRF postgraduate funding programme.',
   'https://nrfconnect.nrf.ac.za/', 'National Research Foundation',
   'https://www.nrf.ac.za/nrf-for-post-graduate-students/bursaries-scholarships/',
   true, true, true, current_date),

  ('nrf-masters-doctoral',
   'DSI-NRF Postgraduate Scholarship — Master''s & Doctoral',
   'National Research Foundation (NRF)', 'scholarship',
   'Master''s · Doctoral', 'Social Sciences & Humanities (incl. Psychology)',
   'SA citizens & permanent residents; minimum 65% in the previous degree; research-based master''s/doctoral study. Apply via NRF Connect.',
   'Full or partial cost of study for master''s and doctoral candidates in Social Sciences and Humanities.',
   'https://nrfconnect.nrf.ac.za/', 'National Research Foundation',
   'https://www.nrf.ac.za/nrf-for-post-graduate-students/bursaries-scholarships/',
   true, true, true, current_date),

  ('nihss',
   'NIHSS Masters & Doctoral Scholarships',
   'National Institute for the Humanities and Social Sciences (NIHSS)', 'scholarship',
   'Master''s · Doctoral', 'Humanities & Social Sciences (incl. Psychology)',
   'SA citizens pursuing master''s or doctoral study in the humanities and social sciences at a South African university. Applied for through your institution / NIHSS.',
   'Scholarships and doctoral school support for humanities and social sciences postgraduates.',
   'https://www.nihss.ac.za/', 'NIHSS', 'https://www.nihss.ac.za/',
   true, true, true, current_date),

  ('samrc',
   'SAMRC Research Scholarships & Bursaries',
   'South African Medical Research Council (SAMRC)', 'research_funding',
   'Master''s · Doctoral', 'Health & mental health research',
   'Postgraduate students conducting health-related research, including mental health. Eligibility and calls are published on the SAMRC site.',
   'Bursaries and scholarships supporting health research capacity, relevant to psychology students in mental health research.',
   'https://www.samrc.ac.za/', 'SAMRC', 'https://www.samrc.ac.za/',
   true, true, true, current_date),

  ('mandela-rhodes',
   'Mandela Rhodes Scholarship',
   'The Mandela Rhodes Foundation', 'scholarship',
   'Postgraduate (Honours and above)', 'Any field, including social sciences',
   'African citizens with a strong academic record and leadership potential, pursuing a postgraduate year at a South African university.',
   'Fully-funded postgraduate scholarship combining academic study with a leadership development programme.',
   'https://www.mandelarhodes.org/', 'Mandela Rhodes Foundation', 'https://www.mandelarhodes.org/',
   true, false, true, current_date),

  ('canon-collins',
   'Canon Collins Scholarships',
   'Canon Collins Trust', 'scholarship',
   'Master''s · Doctoral', 'Social justice, humanities & social sciences',
   'Southern African students pursuing postgraduate study aligned with social justice; specific calls and eligibility are listed on the Canon Collins site.',
   'Postgraduate scholarships for study in Southern Africa and the UK with a social justice focus.',
   'https://canoncollins.org/', 'Canon Collins Trust', 'https://canoncollins.org/',
   true, false, true, current_date),

  ('omt',
   'Oppenheimer Memorial Trust Postgraduate Scholarships',
   'Oppenheimer Memorial Trust (OMT)', 'scholarship',
   'Postgraduate', 'Various, including humanities & social sciences',
   'SA citizens pursuing postgraduate study; awards and eligibility are announced on the OMT site.',
   'Postgraduate scholarship support across a range of disciplines.',
   'https://www.oppenheimermemorialtrust.org/', 'Oppenheimer Memorial Trust', 'https://www.oppenheimermemorialtrust.org/',
   true, false, true, current_date),

  ('funza-lushaka',
   'Funza Lushaka Bursary',
   'Department of Basic Education', 'bursary',
   'Initial teacher education / PGCE', 'Education (route toward Educational Psychology)',
   'SA citizens training as teachers in priority areas; relevant if you are entering education en route to Educational Psychology.',
   'Full-cost teaching bursary; relevant to students following an education pathway.',
   'https://www.funzalushaka.doe.gov.za/', 'Department of Basic Education', 'https://www.funzalushaka.doe.gov.za/',
   true, false, true, current_date),

  ('psyssa',
   'PsySSA Research Grants & Awards',
   'Psychological Society of South Africa (PsySSA)', 'research_funding',
   'Postgraduate / early career', 'Psychology',
   'PsySSA members undertaking psychological research; specific grants and awards are listed on the PsySSA site.',
   'Research grants and awards for the psychology community in South Africa.',
   'https://www.psyssa.com/', 'PsySSA', 'https://www.psyssa.com/',
   true, false, true, current_date)
on conflict (slug) do nothing;

-- Done.
