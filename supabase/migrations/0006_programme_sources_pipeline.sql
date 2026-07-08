-- =====================================================================
-- Migration 0006 — Living programme directory: sources + refresh pipeline.
--
-- SAFE & NON-DESTRUCTIVE. Adds source-tracking + a review queue so programme
-- details can be refreshed from official public pages semi-automatically,
-- with human review only where confidence is low. Safe to run more than once.
--
-- Requires migration 0005 (programmes, saved_programmes) to have run first.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Freshness columns on programmes.
--   last_verified  = a human confirmed the values (already existed)
--   last_checked   = an automated source check last ran
--   needs_review   = there is an unreviewed candidate update, or never verified
--   primary_source_url = convenience pointer to the main official page
-- ---------------------------------------------------------------------
alter table public.programmes add column if not exists last_checked timestamptz;
alter table public.programmes add column if not exists needs_review boolean not null default true;
alter table public.programmes add column if not exists primary_source_url text;

-- ---------------------------------------------------------------------
-- programme_sources — official public URLs to check for each programme.
-- ---------------------------------------------------------------------
create table if not exists public.programme_sources (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  source_type text not null default 'institution', -- institution | department | postgraduate | application | other
  url text not null,
  is_primary boolean not null default false,
  http_status int,
  content_hash text,           -- hash of last-fetched content, to detect changes
  last_checked timestamptz,    -- when the refresher last fetched this URL
  last_changed timestamptz,    -- when the content hash last changed
  status text not null default 'unverified', -- unverified | ok | changed | error | needs_review
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (programme_id, url)
);
create index if not exists idx_programme_sources_programme on public.programme_sources(programme_id);

-- Public read so cards/detail can show the source link + "last checked".
alter table public.programme_sources enable row level security;
drop policy if exists "programme_sources_read_all" on public.programme_sources;
create policy "programme_sources_read_all" on public.programme_sources for select using (true);

-- ---------------------------------------------------------------------
-- programme_updates — the review queue. Each automated check that finds
-- candidate values inserts a row here; a human (or a high-confidence rule)
-- approves it, and only then are values written to programmes.
-- ---------------------------------------------------------------------
create table if not exists public.programme_updates (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  source_id uuid references public.programme_sources(id) on delete set null,
  checked_at timestamptz not null default now(),
  extracted_text text,             -- raw text snippet the values came from
  extracted_opening text,          -- candidate opening date (as found, unparsed)
  extracted_deadline text,         -- candidate closing date
  extracted_fee text,              -- candidate application fee
  extracted_requirements text,     -- candidate minimum requirements
  extracted_documents text,        -- candidate supporting documents
  confidence numeric,              -- 0..1 from the extractor
  needs_review boolean not null default true,
  review_status text not null default 'pending', -- pending | approved | rejected
  reviewed_by uuid,
  reviewed_at timestamptz,
  applied boolean not null default false, -- whether approved values were written to programmes
  created_at timestamptz not null default now()
);
create index if not exists idx_programme_updates_programme on public.programme_updates(programme_id);
create index if not exists idx_programme_updates_review on public.programme_updates(review_status);

-- Review queue is back-office only: no user-facing read/write policy.
-- The refresher and admin tools use the Supabase service role (bypasses RLS).
alter table public.programme_updates enable row level security;

-- ---------------------------------------------------------------------
-- SEED sources from the institutions already in the directory (real,
-- verifiable official homepages — NOT empty placeholders). The refresher
-- starts from these and can discover deeper application pages over time.
-- ---------------------------------------------------------------------
update public.programmes
  set primary_source_url = institution_url
  where primary_source_url is null and institution_url is not null;

insert into public.programme_sources (programme_id, source_type, url, is_primary, status)
select p.id, 'institution', p.institution_url, true, 'unverified'
from public.programmes p
where p.institution_url is not null
  and not exists (
    select 1 from public.programme_sources s
    where s.programme_id = p.id and s.url = p.institution_url
  );

-- Done.
