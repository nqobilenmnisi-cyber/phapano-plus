-- =====================================================================
-- Migration 0024 — Account deletion and public-link reliability.
-- Requires migrations 0020 and 0023. Safe to re-run.
-- =====================================================================

-- Reapply the canonical bio fix in case an older environment skipped 0020.
alter table public.community_profiles
  drop constraint if exists community_profiles_bio_check;

-- Prefix legacy web addresses that were stored before profile URL
-- normalisation was introduced. Current writes are already normalised by the
-- application and unsafe schemes are not changed.
update public.profiles
set website_url = 'https://' || trim(website_url)
where nullif(trim(website_url), '') is not null
  and trim(website_url) !~* '^[a-z][a-z0-9+.-]*:';

update public.profiles
set website_url = null
where nullif(trim(website_url), '') is not null
  and trim(website_url) !~* '^https?://';

-- Recreate the zero-argument deletion RPC and explicitly reload PostgREST's
-- schema cache so authenticated clients can resolve it immediately.
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

  delete from auth.users where id = caller_id;
  if not found then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;
end
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

notify pgrst, 'reload schema';
