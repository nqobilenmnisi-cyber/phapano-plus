-- Rollback for migration 0016.
alter table public.community_profiles drop column if exists headline;
alter table public.community_profiles drop column if exists stage_other;
alter table public.community_profiles drop column if exists stream_other;
