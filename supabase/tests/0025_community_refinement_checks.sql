-- Run after migration 0025. The DO block raises on any failed assertion.

do $$
declare
  definition text;
begin
  if to_regclass('public.community_mentions') is null then
    raise exception 'community_mentions table is missing';
  end if;

  if not exists (
    select 1 from pg_class
    where oid = 'public.community_mentions'::regclass
      and relrowsecurity
  ) then
    raise exception 'community_mentions RLS is not enabled';
  end if;

  if (
    select count(*) from pg_policies
    where schemaname = 'public'
      and tablename = 'community_mentions'
  ) < 3 then
    raise exception 'community_mentions policies are incomplete';
  end if;

  foreach definition in array array[
    'community_mentions_notify',
    'community_reactions_notify',
    'community_comments_notify',
    'community_passes_notify'
  ]
  loop
    if not exists (
      select 1 from pg_trigger
      where tgname = definition and not tgisinternal
    ) then
      raise exception 'required trigger % is missing', definition;
    end if;
  end loop;

  select pg_get_constraintdef(oid) into definition
  from pg_constraint
  where conname = 'community_reactions_type_check'
    and conrelid = 'public.community_reactions'::regclass;
  if definition is null
     or definition not like '%support%'
     or definition not like '%insightful%'
     or definition not like '%celebrate%'
     or definition like '%helpful%'
  then
    raise exception 'community reaction constraint is incorrect: %', definition;
  end if;

  select pg_get_constraintdef(oid) into definition
  from pg_constraint
  where conname = 'profiles_professional_category_check'
    and conrelid = 'public.profiles'::regclass;
  if definition is null
     or definition not like '%clinical_psychologist%'
     or definition not like '%counselling_psychologist%'
     or definition not like '%educational_psychologist%'
     or definition not like '%industrial_psychologist%'
     or definition not like '%neuropsychologist%'
     or definition not like '%research_psychologist%'
     or definition not like '%psychometrist%'
     or definition not like '%registered_counsellor%'
  then
    raise exception 'professional category constraint is incomplete';
  end if;

  if exists (
    select 1 from public.community_reactions
    where reaction_type not in ('support', 'insightful', 'celebrate')
  ) then
    raise exception 'an unsupported reaction remains';
  end if;

  if exists (
    select 1 from public.profiles
    where website_url is not null
      and website_url !~* '^https?://'
  ) then
    raise exception 'a personal website is not normalised';
  end if;

  if exists (
    select 1 from public.organisation_pages
    where website_url is not null
      and website_url !~* '^https?://'
  ) then
    raise exception 'an organisation website is not normalised';
  end if;

  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'notifications_unread_dedupe_idx'
  ) then
    raise exception 'notification deduplication index is missing';
  end if;
end
$$;

select
  '0025 community refinement verified' as check_name,
  (select count(*) from public.community_mentions) as mention_count,
  (select count(*) from public.profile_verifications) as verified_profile_badges,
  (select count(*) from public.organisation_pages where is_official) as official_pages;
