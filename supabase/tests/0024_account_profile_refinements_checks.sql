-- Run after migration 0024.

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.community_profiles'::regclass
      and conname = 'community_profiles_bio_check'
  ) then
    raise exception 'Legacy Community bio constraint is still present';
  end if;

  if to_regprocedure('public.delete_own_account()') is null then
    raise exception 'delete_own_account() is missing';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.delete_own_account()',
    'EXECUTE'
  ) or has_function_privilege(
    'anon',
    'public.delete_own_account()',
    'EXECUTE'
  ) then
    raise exception 'delete_own_account() privileges are unsafe';
  end if;

  if exists (
    select 1 from public.profiles
    where nullif(trim(website_url), '') is not null
      and trim(website_url) !~* '^https?://'
  ) then
    raise exception 'A personal website is not a valid HTTP(S) URL';
  end if;
end
$$;

select
  to_regprocedure('public.delete_own_account()') as deletion_rpc,
  (select count(*) from public.profiles
   where nullif(trim(website_url), '') is not null
     and trim(website_url) !~* '^https?://') as invalid_personal_websites;
