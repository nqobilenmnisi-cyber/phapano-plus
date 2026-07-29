-- Roll back migration 0021. Restores the four exact identities and their
-- snapshotted Community relationships, then removes organisation features.

drop trigger if exists reject_organisation_connection
  on public.community_connections;
drop function if exists public.community_reject_organisation_connection();

do $$
declare
  migration constant text := '0021-phapano-organisations-v1';
  target_ids uuid[];
begin
  if to_regclass('private.organisation_identity_account_backup') is null then
    raise notice '0021 backup not found; only schema objects will be removed';
    return;
  end if;

  select array_agg(user_id) into target_ids
  from private.organisation_identity_account_backup
  where migration_key = migration
    and email <> 'nqobiimnisi@gmail.com';

  if coalesce(array_length(target_ids, 1), 0) = 0 then
    return;
  end if;

  update auth.users u
  set banned_until = b.banned_until, updated_at = now()
  from private.organisation_identity_account_backup b
  where b.migration_key = migration and b.user_id = u.id;

  update public.profiles p
  set full_name = restored.full_name,
      surname = restored.surname,
      email = restored.email,
      bio = restored.bio,
      avatar_url = restored.avatar_url,
      updated_at = restored.updated_at
  from (
    select (jsonb_populate_record(null::public.profiles, profile_row)).*
    from private.organisation_identity_account_backup
    where migration_key = migration and profile_row is not null
  ) restored
  where p.id = restored.id;

  update public.community_profiles p
  set display_name = restored.display_name,
      headline = restored.headline,
      visibility = restored.visibility,
      connection_permission = restored.connection_permission,
      avatar_url = restored.avatar_url,
      updated_at = restored.updated_at
  from (
    select (jsonb_populate_record(
      null::public.community_profiles, community_row
    )).*
    from private.organisation_identity_account_backup
    where migration_key = migration and community_row is not null
  ) restored
  where p.user_id = restored.user_id;

  update public.community_posts p
  set author_id = restored.author_id,
      is_official = restored.is_official,
      updated_at = restored.updated_at
  from (
    select (jsonb_populate_record(
      null::public.community_posts, row_data
    )).*
    from private.organisation_identity_relation_backup
    where migration_key = migration and relation_name = 'community_posts'
  ) restored
  where p.id = restored.id;

  update public.community_comments c
  set author_id = restored.author_id,
      updated_at = restored.updated_at
  from (
    select (jsonb_populate_record(
      null::public.community_comments, row_data
    )).*
    from private.organisation_identity_relation_backup
    where migration_key = migration and relation_name = 'community_comments'
  ) restored
  where c.id = restored.id;

  delete from public.community_reactions where user_id = any(target_ids);
  insert into public.community_reactions
  select restored.*
  from (
    select (jsonb_populate_record(
      null::public.community_reactions, row_data
    )).*
    from private.organisation_identity_relation_backup
    where migration_key = migration and relation_name = 'community_reactions'
  ) restored
  on conflict do nothing;

  delete from public.community_follows
  where follower_id = any(target_ids) or followee_id = any(target_ids);
  insert into public.community_follows
  select restored.*
  from (
    select (jsonb_populate_record(
      null::public.community_follows, row_data
    )).*
    from private.organisation_identity_relation_backup
    where migration_key = migration and relation_name = 'community_follows'
  ) restored
  on conflict do nothing;

  delete from public.community_connections
  where requester_id = any(target_ids) or recipient_id = any(target_ids);
  insert into public.community_connections
  select restored.*
  from (
    select (jsonb_populate_record(
      null::public.community_connections, row_data
    )).*
    from private.organisation_identity_relation_backup
    where migration_key = migration and relation_name = 'community_connections'
  ) restored
  on conflict do nothing;

  delete from public.community_blocks
  where blocker_id = any(target_ids) or blocked_id = any(target_ids);
  insert into public.community_blocks
  select restored.*
  from (
    select (jsonb_populate_record(
      null::public.community_blocks, row_data
    )).*
    from private.organisation_identity_relation_backup
    where migration_key = migration and relation_name = 'community_blocks'
  ) restored
  on conflict do nothing;
end
$$;

drop table if exists public.profile_verifications;
drop table if exists public.organisation_page_admins;
drop table if exists public.organisation_pages;
