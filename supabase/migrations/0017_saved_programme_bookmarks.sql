-- =====================================================================
-- Migration 0017 — Separate programme bookmarks from application plans.
-- Requires migration 0005. Safe to re-run and additive.
-- =====================================================================

alter table public.saved_programmes
  add column if not exists is_saved boolean not null default true;

create index if not exists idx_saved_programmes_user_bookmarks
  on public.saved_programmes(user_id, is_saved);
