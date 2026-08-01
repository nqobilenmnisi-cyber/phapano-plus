-- =====================================================================
-- Migration 0028 — Funding freshness, review queue and current calls.
--
-- The public directory only labels an opportunity "Available" when its
-- current cycle was confirmed on an official source. The scheduled monitor
-- records source changes, but never publishes extracted facts automatically:
-- deadlines and eligibility changes always enter the private review queue.
-- =====================================================================

alter table public.funding_opportunities
  add column if not exists source_hash text,
  add column if not exists source_http_status integer,
  add column if not exists source_check_status text not null default 'pending',
  add column if not exists last_checked_at timestamptz,
  add column if not exists last_changed_at timestamptz,
  add column if not exists needs_review boolean not null default false;

do $$ begin
  alter table public.funding_opportunities
    add constraint funding_source_check_status_check
    check (source_check_status in ('pending', 'ok', 'changed', 'error'));
exception when duplicate_object then null;
end $$;

create table if not exists public.funding_updates (
  id uuid primary key default gen_random_uuid(),
  funding_id uuid not null references public.funding_opportunities(id) on delete cascade,
  checked_at timestamptz not null default now(),
  source_url text not null,
  source_hash text,
  extracted jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0,
  change_summary text,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  applied boolean not null default false,
  created_at timestamptz not null default now(),
  unique (funding_id, source_hash)
);

create index if not exists funding_updates_pending_idx
  on public.funding_updates (review_status, checked_at desc);

alter table public.funding_updates enable row level security;

drop policy if exists "funding_updates_admin_read" on public.funding_updates;
create policy "funding_updates_admin_read" on public.funding_updates
  for select using (public.community_is_admin(auth.uid()));

drop policy if exists "funding_updates_admin_write" on public.funding_updates;
create policy "funding_updates_admin_write" on public.funding_updates
  for all using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));

-- Time-bound listings from older cycles must not appear as currently open
-- until their next cycle is confirmed on an official source.
update public.funding_opportunities
set is_open = false,
    source_check_status = 'pending',
    next_review_due_at = current_date
where slug in (
  'nrf-masters-doctoral', 'nihss', 'samrc', 'mandela-rhodes',
  'funza-lushaka', 'nsfas', 'skye-foundation', 'chevening',
  'commonwealth', 'fulbright-foreign-student', 'nrf-postdoc',
  'nrf-kic', 'codesria'
);

-- Current opportunities confirmed against official funder or university
-- pages on 2026-08-01. Eligibility remains a concise discovery summary; the
-- linked official source is authoritative.
insert into public.funding_opportunities
  (slug, title, provider, type, amount_description, eligibility, description,
   closing_date, link, source, source_url, level, field_relevance, categories,
   is_open, featured, status, last_verified_at, next_review_due_at, owner,
   is_published, source_check_status, needs_review)
values
  (
    'nrf-honours',
    'DSTI-NRF Honours Funding — 2027',
    'National Research Foundation (NRF)', 'scholarship',
    'Full cost of study or partial cost of study, subject to NRF rules',
    'For eligible Honours applicants in supported disciplines. Psychology applicants must confirm the current academic and financial eligibility rules and apply through NRF Connect.',
    'The 2027 DSTI-NRF postgraduate call includes general Honours funding across Social Sciences and Humanities.',
    '2026-11-23', 'https://nrfconnect.nrf.ac.za/',
    'National Research Foundation',
    'https://www.nrf.ac.za/dsti-nrf-postgraduate-student-funding-for-the-2027-academic-year/',
    'Honours', 'Social Sciences & Humanities (including Psychology)',
    '{honours}', true, true, 'verified', current_date, current_date + 7,
    'Funding directory', true, 'pending', false
  ),
  (
    'canon-collins',
    'Canon Collins RMTF Scholarships — 2027',
    'Canon Collins Trust', 'scholarship',
    'Postgraduate scholarship; see the current call for the award package',
    'For eligible nationals or residents of Southern African countries applying for a South African Master''s or PhD in one of the call''s specified social-justice subject areas.',
    'Postgraduate support for study in South Africa with a strong social-justice and community-impact focus.',
    '2026-08-14',
    'https://canoncollins.org/scholarships/canon-collins-rmtf-scholarships-for-postgraduate-study/',
    'Canon Collins Trust',
    'https://canoncollins.org/scholarships/canon-collins-rmtf-scholarships-for-postgraduate-study/',
    'Master''s · Doctoral', 'Specified social-justice fields; check whether your Psychology topic qualifies',
    '{masters,doctoral}', true, true, 'verified', current_date, current_date + 3,
    'Funding directory', true, 'pending', false
  ),
  (
    'omt',
    'Oppenheimer Memorial Trust Postgraduate Awards — 2027',
    'Oppenheimer Memorial Trust', 'scholarship',
    'Award value varies by application and available funding',
    'Postgraduate applicants should confirm citizenship, institution, study-mode and academic requirements in the current award guidance.',
    'Postgraduate awards across a range of disciplines, with the current cycle listed by official university funding offices.',
    '2026-08-31', 'https://www.oppenheimermemorialtrust.org/',
    'Oppenheimer Memorial Trust',
    'https://uct.ac.za/students/current-students-funding-postgraduate-degree-funding/postgraduate-degree-funding-noticeboard',
    'Master''s · Doctoral', 'Various fields, including eligible Psychology study',
    '{masters,doctoral}', true, false, 'verified', current_date, current_date + 7,
    'Funding directory', true, 'pending', false
  ),
  (
    'ninety-one-changeblazers-2027',
    'Ninety One Changeblazers Bursary — 2027',
    'Ninety One', 'bursary',
    'Comprehensive bursary support; confirm the current package on the official page',
    'For eligible South African school leavers planning full-time undergraduate study in 2027. Psychology is explicitly included; age, academic and financial-need criteria apply.',
    'An undergraduate bursary supporting young South Africans in listed study fields, including Psychology.',
    null, 'https://ninetyone.com/en/south-africa/about-us/changeblazers',
    'Ninety One', 'https://ninetyone.com/en/south-africa/about-us/changeblazers',
    'Undergraduate', 'Psychology explicitly eligible',
    '{undergraduate}', true, true, 'verified', current_date, current_date + 7,
    'Funding directory', true, 'pending', false
  ),
  (
    'uct-postgraduate-financial-aid-2027',
    'UCT Postgraduate Financial Aid Bursary — 2027',
    'University of Cape Town', 'bursary',
    'Need- and merit-based support; value depends on assessed need and available funds',
    'For qualifying South African citizens and permanent residents pursuing eligible Honours, Master''s or Doctoral study at UCT. Academic merit and financial need are assessed.',
    'UCT''s institutional postgraduate financial-aid bursary for eligible postgraduate students.',
    null,
    'https://uct.ac.za/students/fees-funding-postgraduate-degree-funding-bursaries-scholarships/uct-merit-and-need-awards',
    'University of Cape Town',
    'https://uct.ac.za/students/fees-funding-postgraduate-degree-funding-bursaries-scholarships/uct-merit-and-need-awards',
    'Honours · Master''s · Doctoral', 'All eligible UCT fields, including Psychology',
    '{honours,masters,doctoral}', true, false, 'verified', current_date, current_date + 7,
    'Funding directory', true, 'pending', false
  ),
  (
    'rhodes-postgraduate-scholarship-2027',
    'Rhodes University Postgraduate Scholarship — 2027',
    'Rhodes University', 'scholarship',
    'Institutional postgraduate scholarship; award varies by level and available funding',
    'For eligible Rhodes University Honours, Master''s and PhD applicants across all fields. The published call requires at least a 65% academic average.',
    'Rhodes University institutional funding for postgraduate study across all disciplines.',
    '2026-08-15', 'https://www.ru.ac.za/researchgateway/postgraduates/funding/internal/',
    'Rhodes University', 'https://www.ru.ac.za/researchgateway/postgraduates/funding/internal/',
    'Honours · Master''s · Doctoral', 'All fields, including Psychology',
    '{honours,masters,doctoral}', true, true, 'verified', current_date, current_date + 5,
    'Funding directory', true, 'pending', false
  ),
  (
    'rhodes-ruth-first-2027',
    'Ruth First Scholarship — 2027',
    'Rhodes University', 'scholarship',
    'R120,000 for Master''s or R130,000 for PhD, according to the current call',
    'For eligible Master''s or PhD research with a social or human-rights focus in a relevant field. Psychology topics must fit the published focus and criteria.',
    'Postgraduate scholarship supporting socially engaged and human-rights-focused research.',
    '2026-08-25', 'https://www.ru.ac.za/researchgateway/postgraduates/funding/internal/',
    'Rhodes University', 'https://www.ru.ac.za/researchgateway/postgraduates/funding/internal/',
    'Master''s · Doctoral', 'Social and human-rights research; Psychology topics may qualify',
    '{masters,doctoral,research_grant}', true, false, 'verified', current_date, current_date + 7,
    'Funding directory', true, 'pending', false
  ),
  (
    'ufs-postgraduate-support-2026',
    'UFS Postgraduate Financial Support',
    'University of the Free State', 'bursary',
    'Partial tuition-fee support for qualifying postgraduate students',
    'For qualifying postgraduate students registered at UFS. Check the Centre for Graduate Support rules and application requirements for your programme.',
    'Partial tuition support administered through the UFS Centre for Graduate Support.',
    '2026-11-30', 'https://www.ufs.ac.za/register/postgrad',
    'University of the Free State', 'https://www.ufs.ac.za/register/postgrad',
    'Postgraduate', 'Eligible UFS postgraduate fields, including Psychology',
    '{honours,masters,doctoral}', true, false, 'verified', current_date, current_date + 14,
    'Funding directory', true, 'pending', false
  ),
  (
    'ernst-ethel-eriksen-2027',
    'Ernst & Ethel Eriksen Trust Study Grant — 2027',
    'Ernst & Ethel Eriksen Trust', 'bursary',
    'Up to R20,000, according to the official application guidance',
    'For qualifying South African postgraduate students undertaking Master''s or Doctoral study at an approved South African university. Confirm all current documentation requirements.',
    'A postgraduate study grant for Master''s and Doctoral candidates at approved South African universities.',
    '2026-09-30', 'https://www.eriksentrust.co.za/HowtoApply/tabid/58/Default.aspx',
    'Ernst & Ethel Eriksen Trust', 'https://www.eriksentrust.co.za/HowtoApply/tabid/58/Default.aspx',
    'Master''s · Doctoral', 'All eligible fields, including Psychology',
    '{masters,doctoral}', true, false, 'verified', current_date, current_date + 14,
    'Funding directory', true, 'pending', false
  ),
  (
    'mmeg-south-africa-2027',
    'MMEG South Africa Program — 2027',
    'Margaret McNamara Education Grants', 'scholarship',
    'Up to US$7,000, subject to the current programme rules',
    'For self-identifying women aged 25 or older who meet the nationality, registration, institution and study-mode requirements for the South Africa programme.',
    'Education grants supporting women studying in person at eligible South African institutions.',
    '2026-09-14', 'https://www.mmeg.org/apply',
    'Margaret McNamara Education Grants', 'https://www.mmeg.org/apply',
    'Undergraduate · Postgraduate', 'Eligible disciplines, including Psychology',
    '{undergraduate,honours,masters,doctoral}', true, false, 'verified', current_date, current_date + 14,
    'Funding directory', true, 'pending', false
  ),
  (
    'wits-postgraduate-merit-award-2026',
    'Wits Postgraduate Merit Award',
    'University of the Witwatersrand', 'scholarship',
    'Up to R71,900, subject to merit and available funding',
    'For eligible full-time Wits Honours, Master''s and PhD students who meet the current academic and registration criteria.',
    'Institutional merit funding for postgraduate students at Wits.',
    null,
    'https://www.wits.ac.za/study-at-wits/financial-aid-and-scholarships-administration/scholarships-and-bursaries/',
    'University of the Witwatersrand',
    'https://www.wits.ac.za/study-at-wits/financial-aid-and-scholarships-administration/scholarships-and-bursaries/',
    'Honours · Master''s · Doctoral', 'All eligible Wits fields, including Psychology',
    '{honours,masters,doctoral}', true, false, 'verified', current_date, current_date + 14,
    'Funding directory', true, 'pending', false
  )
on conflict (slug) where slug is not null do update set
  title = excluded.title,
  provider = excluded.provider,
  type = excluded.type,
  amount_description = excluded.amount_description,
  eligibility = excluded.eligibility,
  description = excluded.description,
  closing_date = excluded.closing_date,
  link = excluded.link,
  source = excluded.source,
  source_url = excluded.source_url,
  level = excluded.level,
  field_relevance = excluded.field_relevance,
  categories = excluded.categories,
  is_open = excluded.is_open,
  featured = excluded.featured,
  status = excluded.status,
  last_verified_at = excluded.last_verified_at,
  next_review_due_at = excluded.next_review_due_at,
  owner = excluded.owner,
  is_published = excluded.is_published,
  needs_review = false;

notify pgrst, 'reload schema';
