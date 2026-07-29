-- =====================================================================
-- Migration 0026 — V1 community media, page actors and profile banners.
-- Requires migrations 0013–0025. Safe to re-run.
-- =====================================================================

alter table public.profiles
  add column if not exists banner_url text;
alter table public.community_profiles
  add column if not exists banner_url text;
alter table public.organisation_pages
  add column if not exists banner_url text;

-- Keep the legacy single-image shape valid while the application migrates to
-- ordered attachments.
alter table public.community_posts
  drop constraint if exists community_posts_media_shape_check;
alter table public.community_posts
  add constraint community_posts_media_shape_check check (
    (image_path is null and media_status = 'none')
    or (
      image_path is not null
      and media_status in ('pending', 'approved', 'removed')
      and image_mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and image_size_bytes between 1 and 20971520
      and image_path !~ '(^|/)\.\.(/|$)'
    )
  );

-- Server actions enforce that a new post has a caption, attachment or carried
-- post. The relaxed database check permits an attachment row to be inserted
-- immediately after its parent post without a brittle placeholder caption.
alter table public.community_posts
  drop constraint if exists community_posts_body_or_pass_check;
alter table public.community_posts
  add constraint community_posts_body_or_pass_check check (
    char_length(body) <= 2000
  );

create table if not exists public.community_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  storage_path text not null unique,
  kind text not null check (kind in ('image', 'pdf')),
  mime_type text not null check (
    mime_type in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')
  ),
  size_bytes bigint not null check (size_bytes between 1 and 20971520),
  position smallint not null check (position between 0 and 3),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'removed')),
  created_at timestamptz not null default now(),
  unique (post_id, position)
);

create index if not exists community_post_attachments_review_idx
  on public.community_post_attachments (status, created_at desc);
create index if not exists community_post_attachments_post_idx
  on public.community_post_attachments (post_id, position);

alter table public.community_post_attachments enable row level security;

drop policy if exists cpa_select on public.community_post_attachments;
create policy cpa_select on public.community_post_attachments for select using (
  status = 'approved'
  or created_by = auth.uid()
  or public.community_is_admin(auth.uid())
);

drop policy if exists cpa_insert on public.community_post_attachments;
create policy cpa_insert on public.community_post_attachments for insert with check (
  created_by = auth.uid()
  and storage_path like auth.uid()::text || '/pending/%'
  and exists (
    select 1
    from public.community_posts p
    where p.id = post_id and p.created_by = auth.uid()
  )
);

drop policy if exists cpa_delete on public.community_post_attachments;
create policy cpa_delete on public.community_post_attachments for delete using (
  (created_by = auth.uid() and status = 'pending')
  or public.community_is_admin(auth.uid())
);

drop policy if exists cpa_update on public.community_post_attachments;
create policy cpa_update on public.community_post_attachments for update using (
  public.community_is_admin(auth.uid())
) with check (public.community_is_admin(auth.uid()));

-- Reactions can be attributed to the signed-in member or a page they manage,
-- while created_by preserves the accountable human actor.
alter table public.community_reactions
  add column if not exists actor_id uuid,
  add column if not exists created_by uuid references auth.users(id) on delete cascade;

update public.community_reactions
set actor_id = coalesce(actor_id, user_id),
    created_by = coalesce(created_by, user_id)
where actor_id is null or created_by is null;

alter table public.community_reactions
  alter column actor_id set not null,
  alter column created_by set not null;
alter table public.community_reactions
  drop constraint if exists community_reactions_pkey;
create unique index if not exists community_reactions_post_actor_idx
  on public.community_reactions (post_id, actor_id);
create index if not exists community_reactions_created_by_idx
  on public.community_reactions (created_by, created_at desc);

drop policy if exists cr_insert on public.community_reactions;
create policy cr_insert on public.community_reactions for insert with check (
  created_by = auth.uid()
  and user_id = auth.uid()
  and public.community_can_publish_as(actor_id, auth.uid())
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id
      and p.status = 'published'
      and not public.community_blocked_between(p.author_id, auth.uid())
  )
);
drop policy if exists cr_delete on public.community_reactions;
create policy cr_delete on public.community_reactions for delete using (
  created_by = auth.uid()
  and public.community_can_publish_as(actor_id, auth.uid())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-post-media',
  'community-post-media',
  false,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_media_select_safe" on storage.objects;
create policy "community_media_select_safe" on storage.objects
  for select to authenticated using (
    bucket_id = 'community-post-media'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.community_is_admin(auth.uid())
      or exists (
        select 1 from public.community_posts p
        where p.image_path = storage.objects.name
          and p.media_status = 'approved'
          and p.status = 'published'
      )
      or exists (
        select 1
        from public.community_post_attachments a
        join public.community_posts p on p.id = a.post_id
        where a.storage_path = storage.objects.name
          and a.status = 'approved'
          and p.status = 'published'
      )
    )
  );

-- Public profile artwork uses the existing public avatars bucket. Limits and
-- MIME checks now apply to both avatars and 4:1 banners.
update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'avatars';

create or replace function public.community_actor_name(actor uuid)
returns text
language sql
stable
security definer
set search_path = public as $$
  select coalesce(
    (select name from public.organisation_pages
      where id = actor and status = 'active'),
    (select display_name from public.community_profiles where user_id = actor),
    'A Phapano+ member'
  );
$$;

create or replace function public.community_notify_interaction()
returns trigger
language plpgsql
security definer
set search_path = public as $$
declare
  target_user uuid;
  actor_user uuid;
  actor_identity uuid;
  actor_name text;
  target_post uuid;
  action_text text;
  notification_key text;
begin
  if tg_table_name = 'community_mentions' then
    target_user := new.mentioned_user_id;
    actor_user := new.created_by;
    actor_identity := new.created_by;
    if new.post_id is not null then
      target_post := new.post_id;
    else
      select c.post_id into target_post
      from public.community_comments c where c.id = new.comment_id;
    end if;
    action_text := 'mentioned you';
    notification_key := 'mention:' || new.id::text;
  elsif tg_table_name = 'community_reactions' then
    actor_user := new.created_by;
    actor_identity := new.actor_id;
    target_post := new.post_id;
    select p.created_by into target_user
    from public.community_posts p where p.id = new.post_id;
    action_text := 'reacted to your post';
    notification_key := 'reaction:' || new.post_id::text || ':' || new.actor_id::text;
  elsif tg_table_name = 'community_comments' then
    actor_user := new.created_by;
    actor_identity := new.author_id;
    target_post := new.post_id;
    select p.created_by into target_user
    from public.community_posts p where p.id = new.post_id;
    action_text := 'commented on your post';
    notification_key := 'comment:' || new.id::text;
  elsif tg_table_name = 'community_posts' and new.reshared_post_id is not null then
    actor_user := new.created_by;
    actor_identity := new.author_id;
    target_post := new.reshared_post_id;
    select p.created_by into target_user
    from public.community_posts p where p.id = new.reshared_post_id;
    action_text := 'carried your post forward';
    notification_key := 'carry:' || new.reshared_post_id::text || ':' || new.author_id::text;
  else
    return new;
  end if;

  if target_user is null
     or actor_user is null
     or target_user = actor_user
     or not public.community_notifications_enabled(target_user)
  then
    return new;
  end if;

  actor_name := public.community_actor_name(actor_identity);
  insert into public.notifications (
    user_id, type, title, body, link, dedupe_key
  )
  values (
    target_user,
    'community',
    left(actor_name || ' ' || action_text, 160),
    null,
    '/app/community/post/' || target_post::text,
    notification_key
  )
  on conflict (user_id, dedupe_key)
    where dedupe_key is not null and read = false
  do update set
    title = excluded.title,
    link = excluded.link,
    created_at = now();
  return new;
end $$;

grant select, insert, delete on public.community_post_attachments to authenticated;
grant update on public.community_post_attachments to authenticated;
