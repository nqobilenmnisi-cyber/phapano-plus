-- Run after migration 0023. Raises on a missing field or privacy regression.

do $$
declare
  profile_columns integer;
  community_columns integer;
begin
  select count(*) into profile_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name in (
      'professional_category',
      'professional_category_other',
      'education',
      'experience',
      'share_professional_category',
      'share_education',
      'share_experience'
    );

  select count(*) into community_columns
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'community_profiles'
    and column_name in (
      'professional_category',
      'professional_category_other',
      'education',
      'experience'
    );

  if profile_columns <> 7 or community_columns <> 4 then
    raise exception '0023 profile columns are incomplete';
  end if;

  if exists (
    select 1 from public.profiles
    where share_professional_category is null
       or share_education is null
       or share_experience is null
  ) then
    raise exception '0023 sharing preferences contain null values';
  end if;

  if exists (
    select 1
    from public.community_profiles cp
    join public.profiles p on p.id = cp.user_id
    where
      (not p.share_professional_category and (
        cp.professional_category is not null
        or cp.professional_category_other is not null
      ))
      or (not p.share_education and cp.education <> '[]'::jsonb)
      or (not p.share_experience and cp.experience <> '[]'::jsonb)
  ) then
    raise exception '0023 private Passport data is visible in Community';
  end if;

  if to_regprocedure('public.community_apply_passport_projection()') is null
     or not exists (
       select 1 from information_schema.triggers
       where trigger_schema = 'public'
         and trigger_name = 'profiles_sync_community_projection'
     ) then
    raise exception '0023 Passport projection functions are incomplete';
  end if;
end
$$;

select
  (select count(*) from public.profiles
   where share_professional_category) as shared_professional_categories,
  (select count(*) from public.profiles
   where share_education) as shared_education_profiles,
  (select count(*) from public.profiles
   where share_experience) as shared_experience_profiles,
  (select count(*) from public.community_profiles cp
   join public.profiles p on p.id = cp.user_id
   where (not p.share_education and cp.education <> '[]'::jsonb)
      or (not p.share_experience and cp.experience <> '[]'::jsonb)
  ) as privacy_failures;
