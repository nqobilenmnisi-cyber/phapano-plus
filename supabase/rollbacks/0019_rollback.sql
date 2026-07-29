-- Rollback for migration 0019.
-- Existing Community rows keep their last projected legacy values.

drop trigger if exists profiles_sync_community_projection on public.profiles;
drop trigger if exists community_profiles_project_passport on public.community_profiles;
drop function if exists public.community_sync_passport_update();
drop function if exists public.community_apply_passport_projection();

alter table public.community_profiles drop column if exists province;
alter table public.community_profiles drop column if exists skills;
alter table public.community_profiles drop column if exists volunteering;
alter table public.community_profiles drop column if exists workshops;
alter table public.community_profiles drop column if exists linkedin_url;
alter table public.community_profiles drop column if exists website_url;
alter table public.community_profiles drop column if exists scholar_url;
alter table public.community_profiles drop column if exists researchgate_url;
alter table public.community_profiles drop column if exists orcid;

alter table public.profiles drop column if exists share_bio;
alter table public.profiles drop column if exists share_career_stage;
alter table public.profiles drop column if exists share_university;
alter table public.profiles drop column if exists share_province;
alter table public.profiles drop column if exists share_psychology_interests;
alter table public.profiles drop column if exists share_skills;
alter table public.profiles drop column if exists share_volunteering;
alter table public.profiles drop column if exists share_workshops;
alter table public.profiles drop column if exists share_linkedin;
alter table public.profiles drop column if exists share_website;
alter table public.profiles drop column if exists share_scholar;
alter table public.profiles drop column if exists share_researchgate;
alter table public.profiles drop column if exists share_orcid;
