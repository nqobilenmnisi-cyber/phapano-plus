-- =====================================================================
-- Phapano+ Database Schema  (Milestone 1)
-- The digital home of psychology in South Africa
--
-- Encodes the Information Model (doc 14) and the POPIA data tiers (doc 11):
--   Tier 1  highest sensitivity (journal, mood)         -> owner-only RLS
--   Tier 2  personal/identifying (profiles)             -> owner-only RLS
--   Tier 3  journey data (applications, saved items)    -> owner-only RLS
--   Tier 4  operational/public reference (universities) -> public read
--
-- Trust mixin (doc 09): every knowledge entity carries source, verification
-- status, last_verified_at, next_review_due_at, owner.
-- =====================================================================

-- ---------- Extensions ----------
create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
do $$ begin
  create type career_stage as enum (
    'high_school','undergraduate','honours_applicant','honours','masters_applicant',
    'masters_student','intern','community_service','professional','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('student','professional','admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum (
    'pending','verified','flagged_under_review','updated','expired','archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type psychology_stream as enum (
    'clinical','counselling','research','educational',
    'industrial_organisational','neuropsychology','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_stage as enum (
    'considering','documents','submitted','interview','outcome','accepted','declined'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type funding_type as enum (
    'scholarship','bursary','research_funding','conference_funding','travel_grant','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type mood_label as enum ('hopeful','calm','tired','anxious','low');
exception when duplicate_object then null; end $$;

-- ---------- Helper: updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- =====================================================================
-- PROFILES  (Tier 2) — 1:1 with auth.users
-- =====================================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  surname text,
  email text,
  role user_role not null default 'student',
  career_stage career_stage,
  career_stage_other text,
  university text,
  province text,
  interests psychology_stream[] default '{}',
  bio text,
  research_interests text,
  application_year text,
  goals text,
  skills text,
  volunteering text,
  workshops text,
  linkedin_url text,
  scholar_url text,
  researchgate_url text,
  orcid text,
  website_url text,
  avatar_url text,
  onboarding_complete boolean not null default false,
  founding_member boolean not null default false,
  notification_prefs jsonb not null default
    '{"deadlines":true,"funding":true,"community":true,"product":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- =====================================================================
-- UNIVERSITIES  (Tier 4, public reference) + Trust mixin
-- =====================================================================
create table if not exists universities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  short_name text,
  province text,
  logo_url text,
  website_url text,
  about text,
  -- Trust mixin
  source text,
  source_url text,
  status verification_status not null default 'pending',
  last_verified_at date,
  next_review_due_at date,
  owner text,                        -- accountable domain owner
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_universities_updated on universities;
create trigger trg_universities_updated before update on universities
  for each row execute function set_updated_at();

-- =====================================================================
-- PROGRAMMES  — a stream offered at a university (the unit of verification)
-- =====================================================================
create table if not exists programmes (
  id uuid primary key default uuid_generate_v4(),
  university_id uuid not null references universities(id) on delete cascade,
  stream psychology_stream not null,
  title text not null,
  qualification text,                -- e.g. "MA Clinical Psychology"
  duration text,
  overview text,
  -- application detail (the eleven-field standard)
  opening_date date,
  closing_date date,
  selection_week text,
  interview_process text,
  required_documents text,
  minimum_requirements text,
  referee_requirements text,
  application_link text,
  programme_link text,
  -- Trust mixin
  source text,
  source_url text,
  status verification_status not null default 'pending',
  last_verified_at date,
  next_review_due_at date,
  owner text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_programmes_university on programmes(university_id);
drop trigger if exists trg_programmes_updated on programmes;
create trigger trg_programmes_updated before update on programmes
  for each row execute function set_updated_at();

-- =====================================================================
-- FUNDING OPPORTUNITIES  (Tier 4 public) + Trust mixin
-- =====================================================================
create table if not exists funding_opportunities (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  provider text,
  type funding_type not null default 'bursary',
  amount_description text,
  eligibility text,
  description text,
  closing_date date,
  link text,
  -- eligibility hints used by the Radar (which streams/stages it suits)
  relevant_streams psychology_stream[] default '{}',
  relevant_stages career_stage[] default '{}',
  -- Trust mixin
  source text,
  source_url text,
  status verification_status not null default 'pending',
  last_verified_at date,
  next_review_due_at date,
  owner text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_funding_updated on funding_opportunities;
create trigger trg_funding_updated before update on funding_opportunities
  for each row execute function set_updated_at();

-- =====================================================================
-- ARTICLES  (Tier 4 public) + Trust mixin
-- =====================================================================
create table if not exists articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique,
  excerpt text,
  body text,
  category text,
  reading_minutes int,
  cover_url text,
  -- Trust mixin (review annually)
  source text,
  source_url text,
  status verification_status not null default 'pending',
  last_verified_at date,
  next_review_due_at date,
  owner text,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_articles_updated on articles;
create trigger trg_articles_updated before update on articles
  for each row execute function set_updated_at();

-- =====================================================================
-- APPLICATIONS  (Tier 3) — a user's tracked application to a programme
-- =====================================================================
create table if not exists applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid references programmes(id) on delete set null,
  university_id uuid references universities(id) on delete set null,
  -- denormalised labels so the row survives if reference data changes
  university_label text,
  programme_label text,
  stage application_stage not null default 'considering',
  checklist jsonb not null default '[]'::jsonb,  -- [{label, done}]
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_applications_user on applications(user_id);
drop trigger if exists trg_applications_updated on applications;
create trigger trg_applications_updated before update on applications
  for each row execute function set_updated_at();

-- =====================================================================
-- SAVED UNIVERSITIES  (Tier 3)
-- =====================================================================
create table if not exists saved_universities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid not null references universities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, university_id)
);
create index if not exists idx_saved_uni_user on saved_universities(user_id);

-- =====================================================================
-- SAVED FUNDING  (Tier 3)
-- =====================================================================
create table if not exists saved_funding (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  funding_id uuid not null references funding_opportunities(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, funding_id)
);
create index if not exists idx_saved_fund_user on saved_funding(user_id);

-- =====================================================================
-- JOURNAL ENTRIES  (Tier 1, most protected) — owner-only, never profiled
-- =====================================================================
create table if not exists journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  prompt text,
  approach text,
  priority text,
  due_date date,
  mood mood_label,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_journal_user on journal_entries(user_id);
drop trigger if exists trg_journal_updated on journal_entries;
create trigger trg_journal_updated before update on journal_entries
  for each row execute function set_updated_at();

-- =====================================================================
-- NOTIFICATIONS  (Tier 2) — the "Return" half of the core loop
-- =====================================================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                 -- deadline, funding, system, etc.
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_user on notifications(user_id);

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table profiles            enable row level security;
alter table universities        enable row level security;
alter table programmes          enable row level security;
alter table funding_opportunities enable row level security;
alter table articles            enable row level security;
alter table applications        enable row level security;
alter table saved_universities  enable row level security;
alter table saved_funding       enable row level security;
alter table journal_entries     enable row level security;
alter table notifications       enable row level security;

-- Helper: is the current user an admin?
create or replace function is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ----- PROFILES: owner can see/update own; admins can read all -----
drop policy if exists "profiles_select_own" on profiles;
create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id or is_admin());
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

-- ----- PUBLIC KNOWLEDGE: anyone may read PUBLISHED rows; admins manage -----
drop policy if exists "universities_read_published" on universities;
create policy "universities_read_published" on universities
  for select using (is_published or is_admin());
drop policy if exists "universities_admin_write" on universities;
create policy "universities_admin_write" on universities
  for all using (is_admin()) with check (is_admin());

drop policy if exists "programmes_read_published" on programmes;
create policy "programmes_read_published" on programmes
  for select using (is_published or is_admin());
drop policy if exists "programmes_admin_write" on programmes;
create policy "programmes_admin_write" on programmes
  for all using (is_admin()) with check (is_admin());

drop policy if exists "funding_read_published" on funding_opportunities;
create policy "funding_read_published" on funding_opportunities
  for select using (is_published or is_admin());
drop policy if exists "funding_admin_write" on funding_opportunities;
create policy "funding_admin_write" on funding_opportunities
  for all using (is_admin()) with check (is_admin());

drop policy if exists "articles_read_published" on articles;
create policy "articles_read_published" on articles
  for select using (is_published or is_admin());
drop policy if exists "articles_admin_write" on articles;
create policy "articles_admin_write" on articles
  for all using (is_admin()) with check (is_admin());

-- ----- PERSONAL DATA: strictly owner-only (Tiers 1 & 3) -----
drop policy if exists "applications_own" on applications;
create policy "applications_own" on applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_uni_own" on saved_universities;
create policy "saved_uni_own" on saved_universities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_fund_own" on saved_funding;
create policy "saved_fund_own" on saved_funding
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Journal: owner-only, and NOT readable by admins. Walled off entirely.
drop policy if exists "journal_own" on journal_entries;
create policy "journal_own" on journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_own" on notifications;
create policy "notifications_own" on notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- ACCOUNT DELETION (POPIA, doc 11)
-- A SECURITY DEFINER function letting a signed-in user delete their own
-- auth record. ON DELETE CASCADE removes every owned row (including the
-- most private: journal entries). Real deletion, not a soft flag.
-- =====================================================================
create or replace function delete_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end $$;

revoke all on function delete_own_account() from public;
grant execute on function delete_own_account() to authenticated;

-- ---- Apply directory: programmes + saved_programmes ---------------------
create table if not exists programmes (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  institution text not null,
  institution_url text,
  logo_url text,
  qualification text not null,
  stream text,
  province text,
  status text not null default 'dates_not_confirmed',
  opening_date date,
  closing_date date,
  application_fee text,
  min_requirements text,
  supporting_documents text[] default '{}',
  application_process text,
  places text,
  selection_dates text,
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
alter table programmes enable row level security;
drop policy if exists "programmes_read_all" on programmes;
create policy "programmes_read_all" on programmes for select using (true);

create table if not exists saved_programmes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programme_id uuid not null references programmes(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, programme_id)
);
alter table saved_programmes enable row level security;
drop policy if exists "saved_programmes_own" on saved_programmes;
create policy "saved_programmes_own" on saved_programmes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- freshness + source pipeline (see migrations 0006)
alter table programmes add column if not exists last_checked timestamptz;
alter table programmes add column if not exists needs_review boolean not null default true;
alter table programmes add column if not exists primary_source_url text;

create table if not exists programme_sources (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes(id) on delete cascade,
  source_type text not null default 'institution',
  url text not null,
  is_primary boolean not null default false,
  http_status int,
  content_hash text,
  last_checked timestamptz,
  last_changed timestamptz,
  status text not null default 'unverified',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, url)
);
alter table programme_sources enable row level security;
drop policy if exists "programme_sources_read_all" on programme_sources;
create policy "programme_sources_read_all" on programme_sources for select using (true);

create table if not exists programme_updates (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references programmes(id) on delete cascade,
  source_id uuid references programme_sources(id) on delete set null,
  checked_at timestamptz not null default now(),
  extracted_text text,
  extracted_opening text,
  extracted_deadline text,
  extracted_fee text,
  extracted_requirements text,
  extracted_documents text,
  confidence numeric,
  needs_review boolean not null default true,
  review_status text not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);
alter table programme_updates enable row level security;

-- planning hub: official quick links + personal tracker (see migration 0007)
alter table programmes add column if not exists department_url text;
alter table programmes add column if not exists programme_url text;
alter table programmes add column if not exists requirements_url text;
alter table saved_programmes add column if not exists my_deadline date;
alter table saved_programmes add column if not exists my_fee text;
alter table saved_programmes add column if not exists submitted boolean not null default false;
alter table saved_programmes add column if not exists referees_requested boolean not null default false;
alter table saved_programmes add column if not exists documents_uploaded boolean not null default false;
alter table saved_programmes add column if not exists interview_received boolean not null default false;
alter table saved_programmes add column if not exists selection_completed boolean not null default false;
alter table saved_programmes add column if not exists outcome_received boolean not null default false;
alter table saved_programmes add column if not exists updated_at timestamptz not null default now();

-- planner: extra personal fields (see migration 0008)
alter table saved_programmes add column if not exists personal_statement_done boolean not null default false;
alter table saved_programmes add column if not exists cv_done boolean not null default false;
alter table saved_programmes add column if not exists transcript_uploaded boolean not null default false;

-- planner upgrade (see migration 0009)
alter table saved_programmes add column if not exists status text;
alter table saved_programmes add column if not exists next_action text;
alter table saved_programmes add column if not exists fee_paid boolean not null default false;
alter table saved_programmes add column if not exists notes text;
alter table saved_programmes add column if not exists custom_steps jsonb not null default '[]'::jsonb;

-- funding hub fields (see migration 0010)
alter table funding_opportunities add column if not exists slug text;
alter table funding_opportunities add column if not exists level text;
alter table funding_opportunities add column if not exists field_relevance text;
alter table funding_opportunities add column if not exists is_open boolean not null default true;
alter table funding_opportunities add column if not exists featured boolean not null default false;
alter table funding_opportunities add column if not exists categories text[] not null default '{}';
create unique index if not exists uq_funding_slug on funding_opportunities(slug);
