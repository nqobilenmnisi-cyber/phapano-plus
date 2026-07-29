-- =====================================================================
-- Migration 0020 — Account and profile reliability.
-- Requires migrations 0014 and 0019.
-- Safe to re-run.
-- =====================================================================

-- Passport is the canonical source for the Community bio. The original
-- Community-only 280-character constraint can reject an otherwise valid
-- Passport update while sharing is enabled, so remove that stale limit.
alter table public.community_profiles
  drop constraint if exists community_profiles_bio_check;

-- Let an authenticated user delete only their own auth record. Existing
-- foreign keys remove owned private/community data, while migration 0014
-- retains reports and moderation records with personal references set NULL.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  delete from auth.users
  where id = caller_id;

  if not found then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;
end
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
