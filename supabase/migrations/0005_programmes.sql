-- =====================================================================
-- Migration 0005 — Apply directory: programmes + saved_programmes.
--
-- SAFE & NON-DESTRUCTIVE. Uses `create table if not exists`, `add column if
-- not exists`, and `on conflict do nothing` for the seed. Safe to run more
-- than once. Does not touch existing tables.
--
-- DATA INTEGRITY: the seed contains ONLY stable, verifiable public facts
-- (institution name, province, official website, and whether it offers a
-- Psychology Honours / Master's programme). It deliberately leaves dates,
-- fees, requirements and documents NULL, and last_verified NULL, so the app
-- shows "Dates not confirmed / to be verified". Fill verified details later
-- by editing rows in Supabase — no code changes needed.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- programmes — the maintainable directory (public read).
-- ---------------------------------------------------------------------
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,                          -- stable key for idempotent seeding
  institution text not null,
  institution_url text,
  logo_url text,
  qualification text not null,               -- 'honours' | 'masters'
  stream text,                               -- masters only: clinical | counselling | educational | industrial_organisational | research | neuropsychology | community
  province text,
  status text not null default 'dates_not_confirmed', -- open | closed | opening_soon | dates_not_confirmed
  opening_date date,
  closing_date date,
  application_fee text,                       -- text so "R150" or NULL ("to be confirmed")
  min_requirements text,
  supporting_documents text[] default '{}',
  application_process text,
  places text,                               -- only if officially published
  selection_dates text,                      -- selection week / interviews (if published)
  interview_required boolean,
  references_required boolean,
  cv_required boolean,
  personal_statement_required boolean,
  transcript_required boolean,
  application_link text,
  contact_details text,
  last_verified date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.programmes add column if not exists slug text;
alter table public.programmes add column if not exists institution_url text;
alter table public.programmes add column if not exists logo_url text;
alter table public.programmes add column if not exists supporting_documents text[] default '{}';

create index if not exists idx_programmes_qual on public.programmes(qualification);
create index if not exists idx_programmes_stream on public.programmes(stream);
create index if not exists idx_programmes_province on public.programmes(province);

-- Public (read-only) directory. Writes are done by admins via Supabase (the
-- service role bypasses RLS), so no write policy is exposed to users.
alter table public.programmes enable row level security;
drop policy if exists "programmes_read_all" on public.programmes;
create policy "programmes_read_all" on public.programmes for select using (true);

-- ---------------------------------------------------------------------
-- saved_programmes — each user manages only their own saves.
-- ---------------------------------------------------------------------
create table if not exists public.saved_programmes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid not null references public.programmes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, programme_id)
);

create index if not exists idx_saved_programmes_user on public.saved_programmes(user_id);

alter table public.saved_programmes enable row level security;
drop policy if exists "saved_programmes_own" on public.saved_programmes;
create policy "saved_programmes_own" on public.saved_programmes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- SEED — real institutions, verifiable facts only. Volatile fields NULL.
-- ---------------------------------------------------------------------

-- Honours (offering Psychology Honours is near-universal at these institutions)
insert into public.programmes (slug, institution, institution_url, province, qualification)
values
  ('wits-honours',        'University of the Witwatersrand', 'https://www.wits.ac.za',    'Gauteng',        'honours'),
  ('up-honours',          'University of Pretoria',          'https://www.up.ac.za',      'Gauteng',        'honours'),
  ('uj-honours',          'University of Johannesburg',      'https://www.uj.ac.za',      'Gauteng',        'honours'),
  ('unisa-honours',       'University of South Africa',      'https://www.unisa.ac.za',   'Gauteng',        'honours'),
  ('uct-honours',         'University of Cape Town',         'https://www.uct.ac.za',     'Western Cape',   'honours'),
  ('su-honours',          'Stellenbosch University',         'https://www.sun.ac.za',     'Western Cape',   'honours'),
  ('uwc-honours',         'University of the Western Cape',  'https://www.uwc.ac.za',     'Western Cape',   'honours'),
  ('ukzn-honours',        'University of KwaZulu-Natal',     'https://www.ukzn.ac.za',    'KwaZulu-Natal',  'honours'),
  ('unizulu-honours',     'University of Zululand',          'https://www.unizulu.ac.za', 'KwaZulu-Natal',  'honours'),
  ('ufs-honours',         'University of the Free State',    'https://www.ufs.ac.za',     'Free State',     'honours'),
  ('nwu-honours',         'North-West University',           'https://www.nwu.ac.za',     'North West',     'honours'),
  ('ru-honours',          'Rhodes University',               'https://www.ru.ac.za',      'Eastern Cape',   'honours'),
  ('nmu-honours',         'Nelson Mandela University',       'https://www.mandela.ac.za', 'Eastern Cape',   'honours'),
  ('ufh-honours',         'University of Fort Hare',         'https://www.ufh.ac.za',     'Eastern Cape',   'honours'),
  ('ul-honours',          'University of Limpopo',           'https://www.ul.ac.za',      'Limpopo',        'honours'),
  ('univen-honours',      'University of Venda',             'https://www.univen.ac.za',  'Limpopo',        'honours')
on conflict (slug) do nothing;

-- Master's (professional / research training). Streams listed are well-known
-- offerings; ALL specifics still require verification (dates/fees/requirements
-- are NULL and last_verified is NULL until confirmed on the official site).
insert into public.programmes (slug, institution, institution_url, province, qualification, stream)
values
  -- Clinical
  ('wits-masters-clinical',   'University of the Witwatersrand', 'https://www.wits.ac.za',    'Gauteng',       'masters', 'clinical'),
  ('uct-masters-clinical',    'University of Cape Town',         'https://www.uct.ac.za',     'Western Cape',  'masters', 'clinical'),
  ('su-masters-clinical',     'Stellenbosch University',         'https://www.sun.ac.za',     'Western Cape',  'masters', 'clinical'),
  ('ukzn-masters-clinical',   'University of KwaZulu-Natal',     'https://www.ukzn.ac.za',    'KwaZulu-Natal', 'masters', 'clinical'),
  ('up-masters-clinical',     'University of Pretoria',          'https://www.up.ac.za',      'Gauteng',       'masters', 'clinical'),
  ('uwc-masters-clinical',    'University of the Western Cape',  'https://www.uwc.ac.za',     'Western Cape',  'masters', 'clinical'),
  ('ru-masters-clinical',     'Rhodes University',               'https://www.ru.ac.za',      'Eastern Cape',  'masters', 'clinical'),
  ('ufs-masters-clinical',    'University of the Free State',    'https://www.ufs.ac.za',     'Free State',    'masters', 'clinical'),
  ('nwu-masters-clinical',    'North-West University',           'https://www.nwu.ac.za',     'North West',    'masters', 'clinical'),
  ('nmu-masters-clinical',    'Nelson Mandela University',       'https://www.mandela.ac.za', 'Eastern Cape',  'masters', 'clinical'),
  -- Counselling
  ('up-masters-counselling',  'University of Pretoria',          'https://www.up.ac.za',      'Gauteng',       'masters', 'counselling'),
  ('uwc-masters-counselling', 'University of the Western Cape',  'https://www.uwc.ac.za',     'Western Cape',  'masters', 'counselling'),
  ('su-masters-counselling',  'Stellenbosch University',         'https://www.sun.ac.za',     'Western Cape',  'masters', 'counselling'),
  ('nwu-masters-counselling', 'North-West University',           'https://www.nwu.ac.za',     'North West',    'masters', 'counselling'),
  ('uj-masters-counselling',  'University of Johannesburg',      'https://www.uj.ac.za',      'Gauteng',       'masters', 'counselling'),
  ('ukzn-masters-counselling','University of KwaZulu-Natal',     'https://www.ukzn.ac.za',    'KwaZulu-Natal', 'masters', 'counselling'),
  -- Educational
  ('up-masters-educational',  'University of Pretoria',          'https://www.up.ac.za',      'Gauteng',       'masters', 'educational'),
  ('su-masters-educational',  'Stellenbosch University',         'https://www.sun.ac.za',     'Western Cape',  'masters', 'educational'),
  ('uj-masters-educational',  'University of Johannesburg',      'https://www.uj.ac.za',      'Gauteng',       'masters', 'educational'),
  ('nwu-masters-educational', 'North-West University',           'https://www.nwu.ac.za',     'North West',    'masters', 'educational'),
  ('ufs-masters-educational', 'University of the Free State',    'https://www.ufs.ac.za',     'Free State',    'masters', 'educational'),
  -- Research
  ('wits-masters-research',   'University of the Witwatersrand', 'https://www.wits.ac.za',    'Gauteng',       'masters', 'research'),
  ('up-masters-research',     'University of Pretoria',          'https://www.up.ac.za',      'Gauteng',       'masters', 'research'),
  ('unisa-masters-research',  'University of South Africa',      'https://www.unisa.ac.za',   'Gauteng',       'masters', 'research'),
  ('su-masters-research',     'Stellenbosch University',         'https://www.sun.ac.za',     'Western Cape',  'masters', 'research'),
  -- Industrial/Organisational
  ('up-masters-io',           'University of Pretoria',          'https://www.up.ac.za',      'Gauteng',       'masters', 'industrial_organisational'),
  ('unisa-masters-io',        'University of South Africa',      'https://www.unisa.ac.za',   'Gauteng',       'masters', 'industrial_organisational'),
  ('nwu-masters-io',          'North-West University',           'https://www.nwu.ac.za',     'North West',    'masters', 'industrial_organisational'),
  ('uj-masters-io',           'University of Johannesburg',      'https://www.uj.ac.za',      'Gauteng',       'masters', 'industrial_organisational')
on conflict (slug) do nothing;

-- Done.
