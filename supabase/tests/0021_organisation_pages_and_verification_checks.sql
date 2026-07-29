-- Run after migration 0021. Raises on any schema or exact-identity failure.

do $$
declare
  founder uuid;
  info_page uuid;
  duplicate_info uuid;
  workshops_page uuid;
begin
  if to_regclass('public.organisation_pages') is null
     or to_regclass('public.organisation_page_admins') is null
     or to_regclass('public.profile_verifications') is null then
    raise exception '0021 organisation or verification tables are missing';
  end if;

  if not has_column_privilege(
    'authenticated', 'public.organisation_pages', 'about', 'UPDATE'
  ) then
    raise exception 'Page administrators cannot update public page fields';
  end if;

  if has_column_privilege(
    'authenticated', 'public.organisation_pages', 'is_official', 'UPDATE'
  ) or has_column_privilege(
    'authenticated', 'public.organisation_pages', 'status', 'UPDATE'
  ) then
    raise exception 'Authenticated clients can forge official page state';
  end if;

  if to_regprocedure(
    'public.community_reject_organisation_connection()'
  ) is null then
    raise exception 'Organisation connection guard is missing';
  end if;

  select id into founder
  from auth.users where lower(email) = 'nqobiimnisi@gmail.com';
  select id into info_page
  from auth.users where lower(email) = 'info@phapano.com';
  select id into duplicate_info
  from auth.users where lower(email) = 'phapanothedifference@gmail.com';
  select id into workshops_page
  from auth.users where lower(email) = 'workshops@phapano.com';

  -- Empty/fresh test databases validate the schema only.
  if founder is null or info_page is null or duplicate_info is null
     or workshops_page is null then
    raise notice '0021 exact identity checks skipped: fixtures are absent';
    return;
  end if;

  if (select count(*) from public.organisation_pages
      where id in (info_page, workshops_page)
        and is_official and status = 'active') <> 2 then
    raise exception 'The two official organisation pages are not active';
  end if;

  if not exists (
    select 1 from public.organisation_pages
    where id = workshops_page and parent_page_id = info_page
      and page_type = 'initiative'
  ) then
    raise exception 'Workshops is not linked to the canonical Phapano page';
  end if;

  if (select count(*) from public.organisation_page_admins
      where user_id = founder and page_id in (info_page, workshops_page)
        and role = 'owner') <> 2 then
    raise exception 'Founder ownership of both pages is incomplete';
  end if;

  if (select count(*) from public.profile_verifications
      where user_id = founder
        and badge in ('verified_person', 'founder')) <> 2 then
    raise exception 'Founder verification badges are incomplete';
  end if;

  if exists (
    select 1 from public.community_profiles
    where user_id = duplicate_info and visibility <> 'hidden'
  ) then
    raise exception 'Duplicate Info identity is still public';
  end if;

  if exists (
    select 1 from public.community_posts where author_id = duplicate_info
  ) or exists (
    select 1 from public.community_comments where author_id = duplicate_info
  ) or exists (
    select 1 from public.community_reactions where user_id = duplicate_info
  ) or exists (
    select 1 from public.community_follows
    where follower_id = duplicate_info or followee_id = duplicate_info
  ) or exists (
    select 1 from public.community_blocks
    where blocker_id = duplicate_info or blocked_id = duplicate_info
  ) then
    raise exception 'Duplicate Info content or relationships were not fully merged';
  end if;

  if exists (
    select 1 from public.community_connections
    where status in ('pending', 'accepted')
      and (
        requester_id in (info_page, duplicate_info, workshops_page)
        or recipient_id in (info_page, duplicate_info, workshops_page)
      )
  ) then
    raise exception 'An organisation still has an active connection';
  end if;

  if exists (
    select 1 from auth.users
    where id in (info_page, duplicate_info, workshops_page)
      and (banned_until is null or banned_until <= now())
  ) then
    raise exception 'A retired organisation login remains enabled';
  end if;

  if exists (
    select 1 from auth.users
    where id = founder and banned_until > now()
  ) then
    raise exception 'Founder login was disabled';
  end if;

  begin
    update public.community_connections
    set status = 'pending', accepted_at = null
    where requester_id = info_page or recipient_id = info_page;
    raise exception 'Organisation connection guard accepted a pending connection';
  exception
    when others then
      if sqlerrm not like '%connection_not_allowed%' then
        raise;
      end if;
  end;
end
$$;

select
  (select count(*) from public.organisation_pages
   where status = 'active' and is_official) as active_official_pages,
  (select count(*) from public.profile_verifications) as verification_badges,
  (select count(*) from public.community_connections
   where status in ('pending', 'accepted')
     and (requester_id in (select id from public.organisation_pages)
       or recipient_id in (select id from public.organisation_pages))
  ) as active_organisation_connections;
