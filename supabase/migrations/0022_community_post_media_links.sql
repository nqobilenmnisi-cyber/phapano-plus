-- =====================================================================
-- Migration 0022 — Community post media, links and posting identities.
-- Requires migrations 0013 and 0021. Safe to re-run.
-- =====================================================================

alter table public.community_posts
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists image_path text,
  add column if not exists image_alt_text text,
  add column if not exists image_mime_type text,
  add column if not exists image_size_bytes bigint,
  add column if not exists media_status text not null default 'none',
  add column if not exists link_url text,
  add column if not exists link_title text,
  add column if not exists link_site_name text,
  add column if not exists link_description text,
  add column if not exists link_image_url text,
  add column if not exists reshared_post_id uuid references public.community_posts(id) on delete set null;

update public.community_posts
set created_by = author_id
where created_by is null;

alter table public.community_posts
  drop constraint if exists community_posts_body_check;
alter table public.community_posts
  drop constraint if exists community_posts_body_or_pass_check;
alter table public.community_posts
  add constraint community_posts_body_or_pass_check check (
    (char_length(trim(body)) between 1 and 2000)
    or (reshared_post_id is not null and char_length(body) <= 2000)
  );
alter table public.community_posts
  drop constraint if exists community_posts_media_status_check;
alter table public.community_posts
  add constraint community_posts_media_status_check check (
    media_status in ('none', 'pending', 'approved', 'removed')
  );
alter table public.community_posts
  drop constraint if exists community_posts_media_shape_check;
alter table public.community_posts
  add constraint community_posts_media_shape_check check (
    (image_path is null and media_status = 'none')
    or (
      image_path is not null
      and media_status in ('pending', 'approved', 'removed')
      and image_mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and image_size_bytes between 1 and 5242880
      and image_path !~ '(^|/)\.\.(/|$)'
    )
  );
alter table public.community_posts
  drop constraint if exists community_posts_link_scheme_check;
alter table public.community_posts
  add constraint community_posts_link_scheme_check check (
    link_url is null or link_url ~* '^https?://'
  );

alter table public.community_reactions
  add column if not exists reaction_type text not null default 'support';
alter table public.community_reactions
  drop constraint if exists community_reactions_type_check;
alter table public.community_reactions
  add constraint community_reactions_type_check check (
    reaction_type in ('support', 'helpful', 'celebrate')
  );

alter table public.community_moderation_actions
  drop constraint if exists community_moderation_actions_action_check;
alter table public.community_moderation_actions
  add constraint community_moderation_actions_action_check check (action in (
    'dismiss','remove_content','restore_content','warn','restrict_posting',
    'unrestrict_posting','suspend_community','unsuspend_community','note',
    'resolve','approve_media','remove_media','restore_media'
  ));

alter table public.community_comments
  add column if not exists created_by uuid references auth.users(id) on delete set null;
update public.community_comments
set created_by = author_id
where created_by is null;

create unique index if not exists community_posts_one_pass_per_identity_idx
  on public.community_posts (author_id, reshared_post_id)
  where reshared_post_id is not null;
create index if not exists community_posts_media_queue_idx
  on public.community_posts (media_status, created_at desc)
  where image_path is not null;
create index if not exists community_posts_created_by_idx
  on public.community_posts (created_by, created_at desc);

create or replace function public.community_can_publish_as(identity_id uuid, actor_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select identity_id = actor_id
    or exists (
      select 1
      from public.organisation_pages p
      join public.organisation_page_admins a on a.page_id = p.id
      where p.id = identity_id
        and p.status = 'active'
        and a.user_id = actor_id
    );
$$;

create or replace function public.community_post_is_shareable(post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status = 'published'
  );
$$;

create or replace function public.community_set_content_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.created_by := auth.uid();
    elsif new.created_by is distinct from old.created_by then
      raise exception 'content_actor_cannot_change';
    end if;

    if not public.community_can_publish_as(new.author_id, auth.uid()) then
      raise exception 'posting_identity_not_allowed';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists community_posts_set_actor on public.community_posts;
create trigger community_posts_set_actor
  before insert or update of author_id, created_by on public.community_posts
  for each row execute function public.community_set_content_actor();

drop trigger if exists community_comments_set_actor on public.community_comments;
create trigger community_comments_set_actor
  before insert or update of author_id, created_by on public.community_comments
  for each row execute function public.community_set_content_actor();

drop policy if exists cpo_insert on public.community_posts;
create policy cpo_insert on public.community_posts for insert with check (
  created_by = auth.uid()
  and public.community_can_publish_as(author_id, auth.uid())
  and public.community_can_post(auth.uid())
  and public.community_accepted_terms(auth.uid())
  and (
    reshared_post_id is null
    or public.community_post_is_shareable(reshared_post_id)
  )
);

drop policy if exists cpo_update on public.community_posts;
create policy cpo_update on public.community_posts for update using (
  (
    created_by = auth.uid()
    and public.community_can_publish_as(author_id, auth.uid())
    and status = 'published'
  )
  or public.community_is_admin(auth.uid())
) with check (
  (
    created_by = auth.uid()
    and public.community_can_publish_as(author_id, auth.uid())
  )
  or public.community_is_admin(auth.uid())
);

drop policy if exists cpo_delete on public.community_posts;
create policy cpo_delete on public.community_posts for delete using (
  (
    created_by = auth.uid()
    and public.community_can_publish_as(author_id, auth.uid())
  )
  or public.community_is_admin(auth.uid())
);

drop policy if exists cc_insert on public.community_comments;
create policy cc_insert on public.community_comments for insert with check (
  created_by = auth.uid()
  and public.community_can_publish_as(author_id, auth.uid())
  and public.community_can_post(auth.uid())
  and public.community_accepted_terms(auth.uid())
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id
      and p.status = 'published'
      and not public.community_blocked_between(p.author_id, auth.uid())
  )
);

drop policy if exists cc_update on public.community_comments;
create policy cc_update on public.community_comments for update using (
  (
    created_by = auth.uid()
    and public.community_can_publish_as(author_id, auth.uid())
    and status = 'published'
  )
  or public.community_is_admin(auth.uid())
) with check (
  (
    created_by = auth.uid()
    and public.community_can_publish_as(author_id, auth.uid())
  )
  or public.community_is_admin(auth.uid())
);

drop policy if exists cc_delete on public.community_comments;
create policy cc_delete on public.community_comments for delete using (
  (
    created_by = auth.uid()
    and public.community_can_publish_as(author_id, auth.uid())
  )
  or public.community_is_admin(auth.uid())
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'community-post-media',
  'community-post-media',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "community_media_insert_own" on storage.objects;
create policy "community_media_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'community-post-media'
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.foldername(name))[2] = 'pending'
  );

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
    )
  );

drop policy if exists "community_media_delete_own_pending" on storage.objects;
create policy "community_media_delete_own_pending" on storage.objects
  for delete to authenticated using (
    bucket_id = 'community-post-media'
    and (
      (
        auth.uid()::text = (storage.foldername(name))[1]
        and (storage.foldername(name))[2] = 'pending'
      )
      or public.community_is_admin(auth.uid())
    )
  );
