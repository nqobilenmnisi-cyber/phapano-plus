-- =====================================================================
-- Migration 0009 — University logos + application planner upgrade.
-- SAFE & NON-DESTRUCTIVE (add column if not exists / targeted update).
-- Requires 0005–0008.
-- =====================================================================

-- 1) LOGOS: store a real official-logo URL per institution, derived from its
--    official website domain (a logo service that pulls the real brand mark
--    from the official site). The app falls back to the site favicon and then
--    to initials only if a logo truly can't load. No logos are generated.
update public.programmes
set logo_url = 'https://logo.clearbit.com/' ||
               regexp_replace(institution_url, '^https?://(www\.)?', '')
where institution_url is not null
  and (logo_url is null or logo_url = '');

-- 2) PLANNER: richer per-user application management fields (private).
alter table public.saved_programmes add column if not exists status text;              -- interested | preparing | submitted | interview | waitlisted | accepted | unsuccessful | withdrawn
alter table public.saved_programmes add column if not exists next_action text;          -- one clear next task
alter table public.saved_programmes add column if not exists fee_paid boolean not null default false;
alter table public.saved_programmes add column if not exists notes text;                -- private programme-specific notes
alter table public.saved_programmes add column if not exists custom_steps jsonb not null default '[]'::jsonb; -- [{id,title,done}]

-- Done.
