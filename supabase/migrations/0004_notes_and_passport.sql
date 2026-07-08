-- =====================================================================
-- Migration 0004 — Notes (urgency + due dates) and profile "passport" fields.
--
-- SAFE & NON-DESTRUCTIVE. Only ADDS columns with `add column if not exists`.
-- Never drops or recreates anything. Safe to run more than once. No enums.
--
-- Run this whole file in the Supabase SQL Editor.
-- =====================================================================

-- ---- Notes: optional urgency + optional due date -------------------------
-- (notes are stored in journal_entries; the tag is the existing text column
--  `approach`, custom "Other" tags are stored there as free text.)
alter table public.journal_entries add column if not exists priority text;   -- 'urgent' | 'medium' | 'low' | null
alter table public.journal_entries add column if not exists due_date date;    -- optional reminder date

create index if not exists idx_journal_due on public.journal_entries(due_date);

-- ---- Profile "Phapano Passport" fields (all optional) --------------------
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists scholar_url text;        -- Google Scholar
alter table public.profiles add column if not exists researchgate_url text;
alter table public.profiles add column if not exists orcid text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists skills text;             -- comma-separated, freeform
alter table public.profiles add column if not exists volunteering text;
alter table public.profiles add column if not exists workshops text;

-- Done.
