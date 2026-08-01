-- =====================================================================
-- Migration 0029 — Strict funding integrity audit.
--
-- Public funding is fail-closed: an opportunity remains visible only when
-- its current official page confirms that it either explicitly supports
-- Psychology or accepts applications across all fields of study.
-- Unqualified records are retained for audit/history, but are unpublished.
-- Verified against official provider pages on 2026-08-02.
-- =====================================================================

begin;

-- Hide every prior record first. The audited records below are the only rows
-- republished, preventing an old generic or discipline-restricted listing
-- from remaining visible by accident.
update public.funding_opportunities
set is_published = false,
    is_open = false,
    featured = false
where is_published = true;

insert into public.funding_opportunities
  (slug, title, provider, type, amount_description, eligibility, description,
   closing_date, link, source, source_url, level, field_relevance, categories,
   is_open, featured, status, last_verified_at, next_review_due_at, owner,
   is_published, source_check_status, needs_review)
values
  (
    'nrf-honours',
    'DSTI-NRF Honours Student Funding — 2027',
    'National Research Foundation (NRF)', 'scholarship',
    'Full Cost of Study or Partial Cost of Study, subject to the current framework',
    'South African citizens and permanent residents applying for full-time Honours study must meet the current NRF academic, age and funding criteria. The call covers Science, Engineering, Technology, Social Sciences and Humanities, which includes Psychology study.',
    'General Honours funding for the 2027 academic year across Social Sciences and Humanities and the other published NRF study areas.',
    '2026-11-23',
    'https://www.nrf.ac.za/announcement-of-call-dsti-nrf-honours-student-funding-for-the-academic-year-2027/',
    'National Research Foundation',
    'https://www.nrf.ac.za/announcement-of-call-dsti-nrf-honours-student-funding-for-the-academic-year-2027/',
    'Honours', 'Psychology eligible through Social Sciences and Humanities',
    '{honours}', true, true, 'verified', date '2026-08-02', date '2026-08-09',
    'Funding integrity audit', true, 'ok', false
  ),
  (
    'ninety-one-changeblazers-2027',
    'Ninety One Changeblazers Bursary — 2027',
    'Ninety One', 'bursary',
    'Tuition, accommodation, meals, learning materials and programme support, subject to the current rules',
    'South African citizens under 21 in 2027 who plan to study full time at a South African university. Psychology is explicitly listed. Academic performance, leadership potential and financial need criteria apply.',
    'An undergraduate bursary that explicitly includes Psychology among its supported fields for the 2027 intake.',
    null,
    'https://ninetyone.com/en/south-africa/about-us/changeblazers',
    'Ninety One',
    'https://ninetyone.com/en/south-africa/about-us/changeblazers',
    'Undergraduate', 'Psychology explicitly eligible',
    '{undergraduate}', true, true, 'verified', date '2026-08-02', date '2026-08-09',
    'Funding integrity audit', true, 'ok', false
  ),
  (
    'rhodes-postgraduate-scholarship-2027',
    'Rhodes University Postgraduate Scholarship — 2027',
    'Rhodes University', 'scholarship',
    'Institutional postgraduate scholarship; award value depends on level and available funding',
    'Rhodes University Honours, Master''s and PhD applicants across all fields of study may apply. A minimum academic average of 65% is required. Applications are submitted through ROSS.',
    'Rhodes University postgraduate funding explicitly open across all fields of study for the 2027 academic year.',
    '2026-08-15',
    'https://www.ru.ac.za/researchgateway/postgraduates/funding/internal/',
    'Rhodes University',
    'https://www.ru.ac.za/researchgateway/postgraduates/funding/internal/',
    'Honours · Master''s · Doctoral', 'All fields, including Psychology',
    '{honours,masters,doctoral}', true, true, 'verified', date '2026-08-02', date '2026-08-07',
    'Funding integrity audit', true, 'ok', false
  ),
  (
    'omt',
    'Oppenheimer Memorial Trust Postgraduate Study Awards — 2027',
    'Oppenheimer Memorial Trust', 'scholarship',
    'Partial postgraduate support; value is determined at the Trustees'' discretion',
    'Master''s, Doctoral and Postdoctoral applicants pursuing academia, research, development or related careers may apply. The official call encourages all disciplines except MBAs, DBAs and narrowly commercial programmes.',
    'Postgraduate awards for studies commencing from January to June 2027, open across all non-excluded disciplines.',
    '2026-08-31',
    'https://www.omt.org.za/postgraduate-study',
    'Oppenheimer Memorial Trust',
    'https://www.omt.org.za/postgraduate-study',
    'Master''s · Doctoral · Postdoctoral', 'All disciplines except the exclusions stated by OMT',
    '{masters,doctoral,postdoctoral}', true, true, 'verified', date '2026-08-02', date '2026-08-09',
    'Funding integrity audit', true, 'ok', false
  ),
  (
    'uct-postgraduate-financial-aid-2027',
    'UCT Postgraduate Financial Aid Bursary — 2027',
    'University of Cape Town', 'bursary',
    'Merit- and need-based support; the value depends on assessed need and available funding',
    'Qualifying South African citizens and permanent residents applying for eligible Honours, Master''s or Doctoral study at UCT. The 2027 call is open to all fields and applications are made through UCT''s postgraduate funding process.',
    'UCT postgraduate financial aid for eligible Honours, Master''s and Doctoral study across all fields.',
    null,
    'https://uct.ac.za/students/fees-funding-postgraduate-degree-funding-bursaries-scholarships/uct-merit-and-need-awards',
    'University of Cape Town',
    'https://uct.ac.za/students/fees-funding-postgraduate-degree-funding-bursaries-scholarships/uct-merit-and-need-awards',
    'Honours · Master''s · Doctoral', 'All eligible UCT fields, including Psychology',
    '{honours,masters,doctoral}', true, false, 'verified', date '2026-08-02', date '2026-08-09',
    'Funding integrity audit', true, 'ok', false
  ),
  (
    'mmeg-south-africa-2027',
    'MMEG South Africa Program — 2027',
    'Margaret McNamara Education Grants', 'scholarship',
    'Education grant; award value is determined under the current programme rules',
    'Self-identifying women aged 25 or older must meet MMEG''s nationality, registration, institution, study-mode and graduation-timing requirements. The South Africa programme does not state a field-of-study restriction.',
    'Education grants for eligible women enrolled at participating South African universities, without a stated subject restriction.',
    '2026-09-14',
    'https://www.mmeg.org/apply',
    'Margaret McNamara Education Grants',
    'https://www.mmeg.org/apply',
    'Undergraduate · Postgraduate', 'No field restriction stated; Psychology eligible',
    '{undergraduate,honours,masters,doctoral}', true, false, 'verified', date '2026-08-02', date '2026-08-16',
    'Funding integrity audit', true, 'ok', false
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
  source_check_status = excluded.source_check_status,
  needs_review = excluded.needs_review;

notify pgrst, 'reload schema';

commit;
