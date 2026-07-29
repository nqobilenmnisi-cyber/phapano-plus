-- =====================================================================
-- Migration 0023 — Structured Passport education and experience.
-- Requires migration 0019. Additive, private by default and safe to re-run.
-- =====================================================================

alter table public.profiles
  add column if not exists professional_category text,
  add column if not exists professional_category_other text,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists experience jsonb not null default '[]'::jsonb,
  add column if not exists share_professional_category boolean not null default false,
  add column if not exists share_education boolean not null default false,
  add column if not exists share_experience boolean not null default false;

alter table public.community_profiles
  add column if not exists professional_category text,
  add column if not exists professional_category_other text,
  add column if not exists education jsonb not null default '[]'::jsonb,
  add column if not exists experience jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_professional_category_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_professional_category_check
      check (
        professional_category is null
        or professional_category in (
          'psychologist',
          'registered_counsellor',
          'psychometrist',
          'other'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'community_profiles_professional_category_check'
      and conrelid = 'public.community_profiles'::regclass
  ) then
    alter table public.community_profiles
      add constraint community_profiles_professional_category_check
      check (
        professional_category is null
        or professional_category in (
          'psychologist',
          'registered_counsellor',
          'psychometrist',
          'other'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_education_array_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_education_array_check
      check (jsonb_typeof(education) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_experience_array_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_experience_array_check
      check (jsonb_typeof(experience) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'community_profiles_education_array_check'
      and conrelid = 'public.community_profiles'::regclass
  ) then
    alter table public.community_profiles
      add constraint community_profiles_education_array_check
      check (jsonb_typeof(education) = 'array');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'community_profiles_experience_array_check'
      and conrelid = 'public.community_profiles'::regclass
  ) then
    alter table public.community_profiles
      add constraint community_profiles_experience_array_check
      check (jsonb_typeof(experience) = 'array');
  end if;
end
$$;

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
    new.professional_category := case
      when passport.share_professional_category then passport.professional_category
      else null
    end;
    new.professional_category_other := case
      when passport.share_professional_category then passport.professional_category_other
      else null
    end;
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
    new.education := case
      when passport.share_education then coalesce(passport.education, '[]'::jsonb)
      else '[]'::jsonb
    end;
    new.experience := case
      when passport.share_experience then coalesce(passport.experience, '[]'::jsonb)
      else '[]'::jsonb
    end;
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

drop trigger if exists profiles_sync_community_projection on public.profiles;
create trigger profiles_sync_community_projection
  after update of
    bio,
    career_stage,
    career_stage_other,
    professional_category,
    professional_category_other,
    university,
    province,
    interests,
    skills,
    volunteering,
    workshops,
    education,
    experience,
    linkedin_url,
    website_url,
    scholar_url,
    researchgate_url,
    orcid,
    avatar_url,
    share_bio,
    share_career_stage,
    share_professional_category,
    share_university,
    share_province,
    share_psychology_interests,
    share_skills,
    share_volunteering,
    share_workshops,
    share_education,
    share_experience,
    share_linkedin,
    share_website,
    share_scholar,
    share_researchgate,
    share_orcid
  on public.profiles
  for each row execute function public.community_sync_passport_update();

-- Re-project existing Community rows. All new fields are still closed because
-- their sharing preferences default to false.
update public.community_profiles set updated_at = updated_at;
