-- =====================================================================
-- Migration 0025 — Community refinement: recognised professional
-- categories, Phapano reactions, mentions and interaction notifications.
-- Additive where possible, private by default and safe to re-run.
-- =====================================================================

-- Replace the former generic "psychologist" category with the six South
-- African psychologist registration categories, plus the two related
-- professional categories already supported by Phapano+.
update public.profiles
set professional_category = null,
    professional_category_other = null
where professional_category = 'psychologist';

update public.community_profiles
set professional_category = null,
    professional_category_other = null
where professional_category = 'psychologist';

alter table public.profiles
  drop constraint if exists profiles_professional_category_check;
alter table public.profiles
  add constraint profiles_professional_category_check check (
    professional_category is null
    or professional_category in (
      'clinical_psychologist',
      'counselling_psychologist',
      'educational_psychologist',
      'industrial_psychologist',
      'neuropsychologist',
      'research_psychologist',
      'psychometrist',
      'registered_counsellor',
      'other'
    )
  );

alter table public.community_profiles
  drop constraint if exists community_profiles_professional_category_check;
alter table public.community_profiles
  add constraint community_profiles_professional_category_check check (
    professional_category is null
    or professional_category in (
      'clinical_psychologist',
      'counselling_psychologist',
      'educational_psychologist',
      'industrial_psychologist',
      'neuropsychologist',
      'research_psychologist',
      'psychometrist',
      'registered_counsellor',
      'other'
    )
  );

-- Rename the old "helpful" reaction without losing existing reactions.
alter table public.community_reactions
  drop constraint if exists community_reactions_type_check;
update public.community_reactions
set reaction_type = 'insightful'
where reaction_type = 'helpful';
alter table public.community_reactions
  add constraint community_reactions_type_check check (
    reaction_type in ('support', 'insightful', 'celebrate')
  );

-- Mentions are stored as relationships instead of being inferred from display
-- names later. This keeps renamed accounts linked to the correct profile.
create table if not exists public.community_mentions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  mentioned_user_id uuid not null references public.community_profiles(user_id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 2 and 60),
  created_at timestamptz not null default now(),
  check ((post_id is null) <> (comment_id is null))
);

create unique index if not exists community_mentions_post_unique
  on public.community_mentions (post_id, mentioned_user_id)
  where post_id is not null;
create unique index if not exists community_mentions_comment_unique
  on public.community_mentions (comment_id, mentioned_user_id)
  where comment_id is not null;
create index if not exists community_mentions_user_created_idx
  on public.community_mentions (mentioned_user_id, created_at desc);

alter table public.community_mentions enable row level security;

drop policy if exists community_mentions_select on public.community_mentions;
create policy community_mentions_select on public.community_mentions
for select to authenticated using (
  (
    post_id is not null
    and exists (
      select 1
      from public.community_posts p
      where p.id = post_id
        and p.status = 'published'
        and not public.community_blocked_between(p.author_id, auth.uid())
    )
  )
  or
  (
    comment_id is not null
    and exists (
      select 1
      from public.community_comments c
      join public.community_posts p on p.id = c.post_id
      where c.id = comment_id
        and c.status = 'published'
        and p.status = 'published'
        and not public.community_blocked_between(c.author_id, auth.uid())
    )
  )
);

drop policy if exists community_mentions_insert on public.community_mentions;
create policy community_mentions_insert on public.community_mentions
for insert to authenticated with check (
  created_by = auth.uid()
  and mentioned_user_id <> auth.uid()
  and not public.community_blocked_between(mentioned_user_id, auth.uid())
  and (
    (
      post_id is not null
      and exists (
        select 1 from public.community_posts p
        where p.id = post_id and p.created_by = auth.uid()
      )
    )
    or
    (
      comment_id is not null
      and exists (
        select 1 from public.community_comments c
        where c.id = comment_id and c.created_by = auth.uid()
      )
    )
  )
);

drop policy if exists community_mentions_delete on public.community_mentions;
create policy community_mentions_delete on public.community_mentions
for delete to authenticated using (created_by = auth.uid());

grant select, insert, delete on public.community_mentions to authenticated;

-- A single trigger function keeps notification language and privacy behaviour
-- consistent for comments, reactions, passes and explicit mentions.
alter table public.notifications
  add column if not exists dedupe_key text;
create unique index if not exists notifications_unread_dedupe_idx
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null and read = false;

create or replace function public.community_actor_name(actor uuid)
returns text
language sql
stable
security definer
set search_path = public as $$
  select coalesce(
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
  actor_name text;
  target_post uuid;
  action_text text;
  notification_key text;
begin
  if tg_table_name = 'community_mentions' then
    target_user := new.mentioned_user_id;
    actor_user := new.created_by;
    if new.post_id is not null then
      target_post := new.post_id;
    else
      select c.post_id into target_post
      from public.community_comments c where c.id = new.comment_id;
    end if;
    action_text := 'mentioned you';
    notification_key := 'mention:' || new.id::text;
  elsif tg_table_name = 'community_reactions' then
    actor_user := new.user_id;
    target_post := new.post_id;
    select p.created_by into target_user
    from public.community_posts p where p.id = new.post_id;
    action_text := 'reacted to your post';
    notification_key := 'reaction:' || new.post_id::text || ':' || new.user_id::text;
  elsif tg_table_name = 'community_comments' then
    actor_user := new.created_by;
    target_post := new.post_id;
    select p.created_by into target_user
    from public.community_posts p where p.id = new.post_id;
    action_text := 'commented on your post';
    notification_key := 'comment:' || new.id::text;
  elsif tg_table_name = 'community_posts' and new.reshared_post_id is not null then
    actor_user := new.created_by;
    target_post := new.reshared_post_id;
    select p.created_by into target_user
    from public.community_posts p where p.id = new.reshared_post_id;
    action_text := 'passed on your post';
    notification_key := 'pass:' || new.reshared_post_id::text || ':' || new.created_by::text;
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

  actor_name := public.community_actor_name(actor_user);
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

drop trigger if exists community_mentions_notify on public.community_mentions;
create trigger community_mentions_notify
  after insert on public.community_mentions
  for each row execute function public.community_notify_interaction();

drop trigger if exists community_reactions_notify on public.community_reactions;
create trigger community_reactions_notify
  after insert on public.community_reactions
  for each row execute function public.community_notify_interaction();

drop trigger if exists community_comments_notify on public.community_comments;
create trigger community_comments_notify
  after insert on public.community_comments
  for each row execute function public.community_notify_interaction();

drop trigger if exists community_passes_notify on public.community_posts;
create trigger community_passes_notify
  after insert on public.community_posts
  for each row
  when (new.reshared_post_id is not null)
  execute function public.community_notify_interaction();

revoke all on function public.community_actor_name(uuid) from public;
revoke all on function public.community_notify_interaction() from public;
grant execute on function public.community_actor_name(uuid) to authenticated;

-- Keep already-entered protocol-free websites usable in the public profile.
update public.profiles
set website_url = 'https://' || website_url
where website_url is not null
  and website_url !~* '^https?://';

update public.organisation_pages
set website_url = 'https://' || website_url
where website_url is not null
  and website_url !~* '^https?://';
