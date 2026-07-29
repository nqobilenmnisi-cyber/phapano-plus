-- =====================================================================
-- Migration 0019 — Canonical Passport data with field-level sharing.
-- Requires migrations 0004, 0013, 0016 and 0018.
-- Additive and safe to re-run. Private profile rows remain owner-readable.
-- =====================================================================

-- Sharing choices belong to the private Passport and default closed.
alter table public.profiles add column if not exists share_bio boolean not null default false;
alter table public.profiles add column if not exists share_career_stage boolean not null default false;
alter table public.profiles add column if not exists share_university boolean not null default false;
alter table public.profiles add column if not exists share_province boolean not null default false;
alter table public.profiles add column if not exists share_psychology_interests boolean not null default false;
alter table public.profiles add column if not exists share_skills boolean not null default false;
alter table public.profiles add column if not exists share_volunteering boolean not null default false;
alter table public.profiles add column if not exists share_workshops boolean not null default false;
alter table public.profiles add column if not exists share_linkedin boolean not null default false;
alter table public.profiles add column if not exists share_website boolean not null default false;
alter table public.profiles add column if not exists share_scholar boolean not null default false;
alter table public.profiles add column if not exists share_researchgate boolean not null default false;
alter table public.profiles add column if not exists share_orcid boolean not null default false;

-- These public columns are a derived projection, never a second editable copy.
alter table public.community_profiles add column if not exists province text;
alter table public.community_profiles add column if not exists skills text;
alter table public.community_profiles add column if not exists volunteering text;
alter table public.community_profiles add column if not exists workshops text;
alter table public.community_profiles add column if not exists linkedin_url text;
alter table public.community_profiles add column if not exists website_url text;
alter table public.community_profiles add column if not exists scholar_url text;
alter table public.community_profiles add column if not exists researchgate_url text;
alter table public.community_profiles add column if not exists orcid text;

-- Preserve prior explicit Community sharing intent for fields that already
-- existed publicly. Newly introduced fields remain private until opted in.
update public.profiles p
set
  share_bio = p.share_bio or cp.bio is not null,
  share_career_stage = p.share_career_stage or cp.stage is not null,
  share_university = p.share_university or cp.institution is not null,
  share_psychology_interests =
    p.share_psychology_interests
    or cp.stream is not null
    or cardinality(cp.interests) > 0
from public.community_profiles cp
where cp.user_id = p.id;

-- Every Community write is forced back to the canonical private Passport.
-- This protects the boundary even if a client bypasses the application form.
create or replace function public.community_apply_passport_projection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  passport public.profiles%rowtype;
begin
  select * into passport from public.profiles where id = new.user_id;
  if found then
    new.stage := case when passport.share_career_stage then passport.career_stage else null end;
    new.stage_other := case when passport.share_career_stage then passport.career_stage_other else null end;
    new.institution := case when passport.share_university then passport.university else null end;
    new.province := case when passport.share_province then passport.province else null end;
    new.bio := case when passport.share_bio then passport.bio else null end;
    new.stream := case
      when passport.share_psychology_interests then passport.interests[1]
      else null
    end;
    new.stream_other := null;
    new.interests := case
      when passport.share_psychology_interests then coalesce(passport.interests, '{}')
      else '{}'
    end;
    new.skills := case when passport.share_skills then passport.skills else null end;
    new.volunteering := case when passport.share_volunteering then passport.volunteering else null end;
    new.workshops := case when passport.share_workshops then passport.workshops else null end;
    new.linkedin_url := case when passport.share_linkedin then passport.linkedin_url else null end;
    new.website_url := case when passport.share_website then passport.website_url else null end;
    new.scholar_url := case when passport.share_scholar then passport.scholar_url else null end;
    new.researchgate_url := case when passport.share_researchgate then passport.researchgate_url else null end;
    new.orcid := case when passport.share_orcid then passport.orcid else null end;
    new.avatar_url := passport.avatar_url;
  end if;
  return new;
end
$$;

drop trigger if exists community_profiles_project_passport on public.community_profiles;
create trigger community_profiles_project_passport
  before insert or update on public.community_profiles
  for each row execute function public.community_apply_passport_projection();

-- Passport edits, including avatar changes, immediately refresh the public
-- projection. Private-only columns are deliberately absent from this trigger.
create or replace function public.community_sync_passport_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.community_profiles
  set updated_at = now()
  where user_id = new.id;
  return new;
end
$$;

drop trigger if exists profiles_sync_community_projection on public.profiles;
create trigger profiles_sync_community_projection
  after update of
    bio,
    career_stage,
    career_stage_other,
    university,
    province,
    interests,
    skills,
    volunteering,
    workshops,
    linkedin_url,
    website_url,
    scholar_url,
    researchgate_url,
    orcid,
    avatar_url,
    share_bio,
    share_career_stage,
    share_university,
    share_province,
    share_psychology_interests,
    share_skills,
    share_volunteering,
    share_workshops,
    share_linkedin,
    share_website,
    share_scholar,
    share_researchgate,
    share_orcid
  on public.profiles
  for each row execute function public.community_sync_passport_update();

-- Apply the canonical projection to existing Community profiles now.
update public.community_profiles
set updated_at = updated_at;
