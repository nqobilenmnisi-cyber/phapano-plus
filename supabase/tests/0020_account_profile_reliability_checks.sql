-- Run after migration 0020. The DO block raises on any failed assertion.

do $$
declare
  delete_function record;
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'community_profiles'
      and c.conname = 'community_profiles_bio_check'
  ) then
    raise exception 'The stale Community bio constraint still exists';
  end if;

  select p.prosecdef, p.proconfig
  into delete_function
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'delete_own_account'
    and p.pronargs = 0;

  if not found or not delete_function.prosecdef then
    raise exception 'delete_own_account() is missing or is not SECURITY DEFINER';
  end if;

  if not (
    'search_path=pg_catalog, public, auth' = any(delete_function.proconfig)
  ) then
    raise exception 'delete_own_account() does not have the expected fixed search path';
  end if;

  if not has_function_privilege(
    'authenticated',
    'public.delete_own_account()',
    'EXECUTE'
  ) then
    raise exception 'Authenticated users cannot execute delete_own_account()';
  end if;

  if has_function_privilege('anon', 'public.delete_own_account()', 'EXECUTE') then
    raise exception 'Anonymous users can execute delete_own_account()';
  end if;

  if (
    select count(*)
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and (
        (t.relname = 'community_reports' and c.confdeltype = 'n')
        or (
          t.relname = 'community_moderation_actions'
          and c.confdeltype = 'n'
        )
      )
  ) < 4 then
    raise exception 'Anonymising report/moderation foreign keys are incomplete';
  end if;
end
$$;

select
  to_regprocedure('public.delete_own_account()') as deletion_rpc,
  not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'community_profiles'
      and c.conname = 'community_profiles_bio_check'
  ) as passport_bio_can_project,
  has_function_privilege(
    'authenticated',
    'public.delete_own_account()',
    'EXECUTE'
  ) as authenticated_can_delete,
  not has_function_privilege(
    'anon',
    'public.delete_own_account()',
    'EXECUTE'
  ) as anonymous_cannot_delete;
