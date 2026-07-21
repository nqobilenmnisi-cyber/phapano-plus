-- =====================================================================
-- Migration 0013 — Community Lite (beta).
-- SELF-SUFFICIENT & RE-RUNNABLE: create table if not exists, create or
-- replace function, drop policy if exists before create. No dependency on
-- a base schema beyond public.profiles (role) and auth.users.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Tables (created first — see note on section 2).
-- ---------------------------------------------------------------------
create table if not exists public.community_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  stage        text,
  stream       text,
  institution  text check (institution is null or char_length(institution) <= 120),
  bio          text check (bio is null or char_length(bio) <= 280),
  interests    text[] not null default '{}',
  visibility   text not null default 'visible'
               check (visibility in ('visible','limited','hidden')),
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Moderation flags live in their own admin-only table so a user can never
-- edit them through their own profile row.
create table if not exists public.community_moderation_state (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  posting_restricted  boolean not null default false,
  community_suspended boolean not null default false,
  updated_at          timestamptz not null default now()
);

create table if not exists public.community_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists community_follows_followee_idx on public.community_follows (followee_id);

create table if not exists public.community_posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.community_profiles(user_id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  is_official boolean not null default false,
  status     text not null default 'published' check (status in ('published','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at  timestamptz
);
create index if not exists community_posts_created_idx on public.community_posts (created_at desc);
create index if not exists community_posts_author_idx  on public.community_posts (author_id, created_at desc);

create table if not exists public.community_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  author_id  uuid not null references public.community_profiles(user_id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  status     text not null default 'published' check (status in ('published','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at  timestamptz
);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

create table if not exists public.community_reactions (
  post_id    uuid not null references public.community_posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists community_blocks_blocked_idx on public.community_blocks (blocked_id);

create table if not exists public.community_reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid not null references auth.users(id) on delete cascade,
  target_type     text not null check (target_type in ('post','comment','profile')),
  target_post_id    uuid references public.community_posts(id)    on delete set null,
  target_comment_id uuid references public.community_comments(id) on delete set null,
  target_user_id  uuid not null references auth.users(id) on delete cascade,
  category        text not null check (category in (
                    'harassment','misinformation','scam','hate','sexual_content',
                    'privacy','impersonation','spam','professional_misconduct','other')),
  details         text check (details is null or char_length(details) <= 1000),
  content_excerpt text,
  status          text not null default 'open' check (status in ('open','resolved','dismissed')),
  moderator_notes text,
  action_taken    text,
  resolved_by     uuid references auth.users(id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);
-- One report per reporter per item (expression index; no ON CONFLICT needed).
create unique index if not exists community_reports_dedupe_idx on public.community_reports (
  reporter_id, target_type,
  coalesce(target_post_id,    '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(target_comment_id, '00000000-0000-0000-0000-000000000000'::uuid),
  target_user_id
);
create index if not exists community_reports_status_idx on public.community_reports (status, created_at desc);

create table if not exists public.community_moderation_actions (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid references public.community_reports(id) on delete set null,
  admin_id   uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid references auth.users(id) on delete cascade,
  action     text not null check (action in (
               'dismiss','remove_content','restore_content','warn','restrict_posting',
               'unrestrict_posting','suspend_community','unsuspend_community','note','resolve')),
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_terms_acceptances (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  document_type    text not null,
  document_version text not null,
  accepted_at      timestamptz not null default now(),
  unique (user_id, document_type, document_version)
);

-- ---------------------------------------------------------------------
-- 2) Helper functions (SECURITY DEFINER to avoid RLS recursion).
-- NOTE: defined AFTER the tables because `language sql` bodies are
-- validated at creation time and reference the tables above.
-- ---------------------------------------------------------------------
create or replace function public.community_is_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

create or replace function public.community_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- One-directional check: has `a` blocked `b`? Used for profile visibility so
-- a blocker can still see (and unblock) accounts they blocked, while content
-- and discovery remain hidden in both directions via blocked_between.
create or replace function public.community_has_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_blocks where blocker_id = a and blocked_id = b
  );
$$;

create or replace function public.community_accepted_terms(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_terms_acceptances
    where user_id = uid and document_type = 'community_guidelines'
  );
$$;

create or replace function public.community_can_post(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.community_profiles where user_id = uid)
     and not exists (
       select 1 from public.community_moderation_state
       where user_id = uid and (posting_restricted or community_suspended)
     );
$$;

-- Public follower/following counts without exposing the relationship rows.
create or replace function public.community_follow_counts(target uuid)
returns table (followers bigint, following bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.community_follows where followee_id = target),
    (select count(*) from public.community_follows where follower_id = target);
$$;

-- ---------------------------------------------------------------------
-- 3) Atomic block/unblock (block + sever follows both directions).
-- ---------------------------------------------------------------------
create or replace function public.community_block_user(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or target is null or target = auth.uid() then
    raise exception 'invalid block target';
  end if;
  insert into public.community_blocks (blocker_id, blocked_id)
  values (auth.uid(), target) on conflict do nothing;
  delete from public.community_follows
  where (follower_id = auth.uid() and followee_id = target)
     or (follower_id = target and followee_id = auth.uid());
end $$;

create or replace function public.community_unblock_user(target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.community_blocks
  where blocker_id = auth.uid() and blocked_id = target;
end $$;

-- ---------------------------------------------------------------------
-- 4) Row Level Security.
-- ---------------------------------------------------------------------
alter table public.community_profiles          enable row level security;
alter table public.community_moderation_state  enable row level security;
alter table public.community_follows           enable row level security;
alter table public.community_posts             enable row level security;
alter table public.community_comments          enable row level security;
alter table public.community_reactions         enable row level security;
alter table public.community_blocks            enable row level security;
alter table public.community_reports           enable row level security;
alter table public.community_moderation_actions enable row level security;
alter table public.community_terms_acceptances enable row level security;

-- Profiles: own always; others when not hidden, not blocked, not suspended; admins all.
drop policy if exists cp_select on public.community_profiles;
create policy cp_select on public.community_profiles for select using (
  user_id = auth.uid()
  or public.community_is_admin(auth.uid())
  or (
    visibility <> 'hidden'
    and not public.community_has_blocked(user_id, auth.uid())
    and not exists (select 1 from public.community_moderation_state s
                    where s.user_id = community_profiles.user_id and s.community_suspended)
  )
);
drop policy if exists cp_insert on public.community_profiles;
create policy cp_insert on public.community_profiles for insert
  with check (user_id = auth.uid());
drop policy if exists cp_update on public.community_profiles;
create policy cp_update on public.community_profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists cp_delete on public.community_profiles;
create policy cp_delete on public.community_profiles for delete
  using (user_id = auth.uid() or public.community_is_admin(auth.uid()));

-- Moderation state: admins only.
drop policy if exists cms_all on public.community_moderation_state;
create policy cms_all on public.community_moderation_state for all
  using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));

-- Follows: visible only to their participants (counts go via definer fn).
drop policy if exists cf_select on public.community_follows;
create policy cf_select on public.community_follows for select using (
  follower_id = auth.uid() or followee_id = auth.uid()
  or public.community_is_admin(auth.uid())
);
drop policy if exists cf_insert on public.community_follows;
create policy cf_insert on public.community_follows for insert with check (
  follower_id = auth.uid()
  and not public.community_blocked_between(follower_id, followee_id)
  and exists (select 1 from public.community_profiles p
              where p.user_id = followee_id and p.visibility <> 'hidden')
);
drop policy if exists cf_delete on public.community_follows;
create policy cf_delete on public.community_follows for delete
  using (follower_id = auth.uid());

-- Posts.
drop policy if exists cpo_select on public.community_posts;
create policy cpo_select on public.community_posts for select using (
  author_id = auth.uid()
  or public.community_is_admin(auth.uid())
  or (status = 'published' and not public.community_blocked_between(author_id, auth.uid()))
);
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

-- Comments (mirror posts; must also be able to see the parent post).
drop policy if exists cc_select on public.community_comments;
create policy cc_select on public.community_comments for select using (
  author_id = auth.uid()
  or public.community_is_admin(auth.uid())
  or (
    status = 'published'
    and not public.community_blocked_between(author_id, auth.uid())
    and exists (select 1 from public.community_posts p where p.id = post_id)
  )
);
drop policy if exists cc_insert on public.community_comments;
create policy cc_insert on public.community_comments for insert with check (
  author_id = auth.uid()
  and public.community_can_post(auth.uid())
  and public.community_accepted_terms(auth.uid())
  and exists (select 1 from public.community_posts p
              where p.id = post_id and p.status = 'published'
              and not public.community_blocked_between(p.author_id, auth.uid()))
);
drop policy if exists cc_update on public.community_comments;
create policy cc_update on public.community_comments for update using (
  (author_id = auth.uid() and status = 'published')
  or public.community_is_admin(auth.uid())
) with check (author_id = auth.uid() or public.community_is_admin(auth.uid()));
drop policy if exists cc_delete on public.community_comments;
create policy cc_delete on public.community_comments for delete
  using (author_id = auth.uid() or public.community_is_admin(auth.uid()));

-- Reactions: manage own; readable when the post is readable.
drop policy if exists cr_select on public.community_reactions;
create policy cr_select on public.community_reactions for select using (
  exists (select 1 from public.community_posts p where p.id = post_id)
);
drop policy if exists cr_insert on public.community_reactions;
create policy cr_insert on public.community_reactions for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.community_posts p
              where p.id = post_id and p.status = 'published'
              and not public.community_blocked_between(p.author_id, auth.uid()))
);
drop policy if exists cr_delete on public.community_reactions;
create policy cr_delete on public.community_reactions for delete
  using (user_id = auth.uid());

-- Blocks: strictly own.
drop policy if exists cb_all on public.community_blocks;
create policy cb_all on public.community_blocks for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Reports: create own, read own; admins read/update all.
drop policy if exists crep_insert on public.community_reports;
create policy crep_insert on public.community_reports for insert
  with check (reporter_id = auth.uid());
drop policy if exists crep_select on public.community_reports;
create policy crep_select on public.community_reports for select
  using (reporter_id = auth.uid() or public.community_is_admin(auth.uid()));
drop policy if exists crep_update on public.community_reports;
create policy crep_update on public.community_reports for update
  using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));

-- Moderation actions: admins only.
drop policy if exists cma_all on public.community_moderation_actions;
create policy cma_all on public.community_moderation_actions for all
  using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));

-- Terms acceptances: create/read own; admins read.
drop policy if exists cta_insert on public.community_terms_acceptances;
create policy cta_insert on public.community_terms_acceptances for insert
  with check (user_id = auth.uid());
drop policy if exists cta_select on public.community_terms_acceptances;
create policy cta_select on public.community_terms_acceptances for select
  using (user_id = auth.uid() or public.community_is_admin(auth.uid()));
