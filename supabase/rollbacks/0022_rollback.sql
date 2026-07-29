-- Roll back migration 0022 after removing any posts that pass on another post.
-- Storage objects are deliberately retained so a rollback never destroys media.

drop policy if exists "community_media_insert_own" on storage.objects;
drop policy if exists "community_media_select_safe" on storage.objects;
drop policy if exists "community_media_delete_own_pending" on storage.objects;

drop trigger if exists community_posts_set_actor on public.community_posts;
drop trigger if exists community_comments_set_actor on public.community_comments;
drop function if exists public.community_set_content_actor();
drop function if exists public.community_post_is_shareable(uuid);
drop function if exists public.community_can_publish_as(uuid, uuid);

update public.community_posts
set body = 'Passed on a community post.'
where reshared_post_id is not null and trim(body) = '';

alter table public.community_posts
  drop constraint if exists community_posts_body_or_pass_check;
alter table public.community_posts
  add constraint community_posts_body_check
  check (char_length(body) between 1 and 2000);

alter table public.community_posts
  drop constraint if exists community_posts_media_status_check,
  drop constraint if exists community_posts_media_shape_check,
  drop constraint if exists community_posts_link_scheme_check,
  drop column if exists created_by,
  drop column if exists image_path,
  drop column if exists image_alt_text,
  drop column if exists image_mime_type,
  drop column if exists image_size_bytes,
  drop column if exists media_status,
  drop column if exists link_url,
  drop column if exists link_title,
  drop column if exists link_site_name,
  drop column if exists link_description,
  drop column if exists link_image_url,
  drop column if exists reshared_post_id;

alter table public.community_comments drop column if exists created_by;
alter table public.community_reactions
  drop constraint if exists community_reactions_type_check,
  drop column if exists reaction_type;

alter table public.community_moderation_actions
  drop constraint if exists community_moderation_actions_action_check;
alter table public.community_moderation_actions
  add constraint community_moderation_actions_action_check check (action in (
    'dismiss','remove_content','restore_content','warn','restrict_posting',
    'unrestrict_posting','suspend_community','unsuspend_community','note','resolve'
  ));

-- Restore the original 0013 policies.
drop policy if exists cpo_insert on public.community_posts;
create policy cpo_insert on public.community_posts for insert with check (
  author_id = auth.uid()
  and public.community_can_post(auth.uid())
  and public.community_accepted_terms(auth.uid())
);
drop policy if exists cpo_update on public.community_posts;
create policy cpo_update on public.community_posts for update using (
  (author_id = auth.uid() and status = 'published')
  or public.community_is_admin(auth.uid())
) with check (
  author_id = auth.uid() or public.community_is_admin(auth.uid())
);
drop policy if exists cpo_delete on public.community_posts;
create policy cpo_delete on public.community_posts for delete
  using (author_id = auth.uid() or public.community_is_admin(auth.uid()));

drop policy if exists cc_insert on public.community_comments;
create policy cc_insert on public.community_comments for insert with check (
  author_id = auth.uid()
  and public.community_can_post(auth.uid())
  and public.community_accepted_terms(auth.uid())
  and exists (
    select 1 from public.community_posts p
    where p.id = post_id and p.status = 'published'
      and not public.community_blocked_between(p.author_id, auth.uid())
  )
);
drop policy if exists cc_update on public.community_comments;
create policy cc_update on public.community_comments for update using (
  (author_id = auth.uid() and status = 'published')
  or public.community_is_admin(auth.uid())
) with check (author_id = auth.uid() or public.community_is_admin(auth.uid()));
drop policy if exists cc_delete on public.community_comments;
create policy cc_delete on public.community_comments for delete
  using (author_id = auth.uid() or public.community_is_admin(auth.uid()));
