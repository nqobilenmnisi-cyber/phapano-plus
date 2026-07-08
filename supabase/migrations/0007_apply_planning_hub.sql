-- =====================================================================
-- Migration 0007 — Apply as a planning hub.
--   * Official "quick link" columns on programmes (department / programme /
--     application / requirements pages) so the detail page points to the real
--     psychology pages, not just the homepage.
--   * Personal application tracker fields on saved_programmes (per-user, not
--     public programme data).
--
-- SAFE & NON-DESTRUCTIVE (add column if not exists). Re-runnable.
-- Requires migrations 0005 and 0006.
-- =====================================================================

-- Official navigation targets (nullable; shown only when present).
alter table public.programmes add column if not exists department_url text;   -- Psychology department page
alter table public.programmes add column if not exists programme_url text;     -- specific programme page
alter table public.programmes add column if not exists requirements_url text;  -- admission requirements page
-- (application_link already exists for the online application page;
--  institution_url is the last-resort homepage.)

-- Personal application tracker — belongs to the user, tied to a saved
-- programme. NOT public programme information.
alter table public.saved_programmes add column if not exists my_deadline date;
alter table public.saved_programmes add column if not exists my_fee text;
alter table public.saved_programmes add column if not exists submitted boolean not null default false;
alter table public.saved_programmes add column if not exists referees_requested boolean not null default false;
alter table public.saved_programmes add column if not exists documents_uploaded boolean not null default false;
alter table public.saved_programmes add column if not exists interview_received boolean not null default false;
alter table public.saved_programmes add column if not exists selection_completed boolean not null default false;
alter table public.saved_programmes add column if not exists outcome_received boolean not null default false;
alter table public.saved_programmes add column if not exists updated_at timestamptz not null default now();

-- Done.
