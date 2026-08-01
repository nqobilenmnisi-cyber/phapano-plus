-- =====================================================================
-- Migration 0030 — Psychology funding strictness follow-up.
--
-- ZA Bursaries was used only to discover possible opportunities. Every
-- published fact below was checked against a current official provider or
-- administering-partner page on 2026-08-02. Rhodes is removed at the
-- founder's direction; no third-party-only listing is published.
-- =====================================================================

begin;

update public.funding_opportunities
set is_published = false,
    is_open = false,
    featured = false
where slug = 'rhodes-postgraduate-scholarship-2027';

insert into public.funding_opportunities
  (slug, title, provider, type, amount_description, eligibility, description,
   closing_date, link, source, source_url, level, field_relevance, categories,
   is_open, featured, status, last_verified_at, next_review_due_at, owner,
   is_published, source_check_status, needs_review)
values
  (
    'firstrand-empowerment-foundation-2027',
    'FirstRand Empowerment Foundation Undergraduate Bursary — 2027',
    'FirstRand Empowerment Foundation', 'bursary',
    'Tuition, accommodation, meals, learning resources, a monthly stipend and a computer for first-year students',
    'Black South African citizens starting a first degree in 2027 may apply if they meet the published age, Mathematics, admission and household-income criteria. Psychology is explicitly listed among the funded degree programmes.',
    'A comprehensive first-year undergraduate bursary whose official 2027 programme list explicitly includes Psychology.',
    '2026-09-30',
    'https://studytrust.kycdd.co.za/client/-/insert/subscription_id/9ff211fb-b816-470a-a41f-300fea952f78/workflow_id/a117b2f8-4574-482f-a323-fac07ef53661',
    'StudyTrust',
    'https://studytrust.org.za/fref-bursary/',
    'Undergraduate', 'Psychology explicitly eligible',
    '{undergraduate}', true, true, 'verified', date '2026-08-02', date '2026-08-09',
    'Funding integrity audit', true, 'ok', false
  ),
  (
    'old-mutual-education-trust-2027',
    'Old Mutual Education Trust Scholarship — 2027',
    'Old Mutual Education Trust (OMET)', 'scholarship',
    'Partial scholarship of R77,000 per academic year, plus a laptop and student-support benefits',
    'Paid-up members or permanent staff of one of the ten participating unions, and qualifying spouses or child dependants, may apply for a first undergraduate qualification at a South African public university. The programme accepts any field of study.',
    'Partial undergraduate funding across all fields for applicants who meet the participating-union relationship criteria.',
    '2026-08-31',
    'https://webportalapp.com/sp/login/omet_application_26',
    'University of the Western Cape funding notice',
    'https://www.uwc.ac.za/admission-and-financial-aid/fees-and-financial-aid/bursaries-and-opportunities/the-old-mutual-education-trust',
    'Undergraduate', 'All fields, including Psychology',
    '{undergraduate}', true, false, 'verified', date '2026-08-02', date '2026-08-09',
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
