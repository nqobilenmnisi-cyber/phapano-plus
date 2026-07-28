-- =====================================================================
-- Migration 0016 — Community profile fields for UX batch 1.
-- Requires migration 0013. Safe to re-run and additive.
-- =====================================================================

alter table public.community_profiles
  add column if not exists headline text;

alter table public.community_profiles
  add column if not exists stage_other text;

alter table public.community_profiles
  add column if not exists stream_other text;

alter table public.community_profiles
  drop constraint if exists community_profiles_headline_length;
alter table public.community_profiles
  add constraint community_profiles_headline_length
  check (headline is null or char_length(headline) <= 80);

alter table public.community_profiles
  drop constraint if exists community_profiles_stage_other_length;
alter table public.community_profiles
  add constraint community_profiles_stage_other_length
  check (stage_other is null or char_length(stage_other) <= 80);

alter table public.community_profiles
  drop constraint if exists community_profiles_stream_other_length;
alter table public.community_profiles
  add constraint community_profiles_stream_other_length
  check (stream_other is null or char_length(stream_other) <= 80);

alter table public.community_profiles
  drop constraint if exists community_profiles_stage_other_consistency;
alter table public.community_profiles
  add constraint community_profiles_stage_other_consistency
  check (stage_other is null or stage = 'other');

alter table public.community_profiles
  drop constraint if exists community_profiles_stream_other_consistency;
alter table public.community_profiles
  add constraint community_profiles_stream_other_consistency
  check (stream_other is null or stream = 'other');
