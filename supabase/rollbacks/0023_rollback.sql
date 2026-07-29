-- Rollback for migration 0023. This removes structured profile data.

drop trigger if exists profiles_sync_community_projection on public.profiles;

alter table public.community_profiles
  drop column if exists professional_category,
  drop column if exists professional_category_other,
  drop column if exists education,
  drop column if exists experience;

alter table public.profiles
  drop column if exists share_professional_category,
  drop column if exists share_education,
  drop column if exists share_experience,
  drop column if exists professional_category,
  drop column if exists professional_category_other,
  drop column if exists education,
  drop column if exists experience;

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

update public.community_profiles set updated_at = updated_at;
