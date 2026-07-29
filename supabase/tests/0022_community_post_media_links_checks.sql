-- Run after migration 0022. Raises on any schema or policy failure.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_posts'
      and column_name = 'created_by'
  ) then
    raise exception 'Post actor tracking is missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_posts'
      and column_name = 'image_path'
  ) then
    raise exception 'Post media support is missing';
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'community_reactions'
      and column_name = 'reaction_type'
  ) then
    raise exception 'Typed reactions are missing';
  end if;

  if to_regprocedure('public.community_can_publish_as(uuid,uuid)') is null then
    raise exception 'Posting identity guard is missing';
  end if;

  if not exists (
    select 1 from storage.buckets
    where id = 'community-post-media'
      and public = false
      and file_size_limit = 5242880
      and allowed_mime_types @> array['image/jpeg','image/png','image/webp']
  ) then
    raise exception 'Private community media bucket is misconfigured';
  end if;

  if exists (
    select 1 from public.community_posts
    where created_by is null
  ) then
    raise exception 'Existing post actors were not backfilled';
  end if;

  if exists (
    select 1 from public.community_comments
    where created_by is null
  ) then
    raise exception 'Existing comment actors were not backfilled';
  end if;
end
$$;

select
  (select count(*) from public.organisation_pages
   where status = 'active' and is_official) as active_official_pages,
  (select count(*) from public.community_posts
   where created_by is null) as posts_without_actor,
  (select count(*) from public.community_comments
   where created_by is null) as comments_without_actor;
