-- =====================================================================
-- Migration 0015 — Platform hardening for Version 1.
-- REQUIRES 0013 + 0014. SAFE & RE-RUNNABLE. Non-destructive.
--  A) Authoritative rate limits: DB triggers that hold even if a client
--     talks to Supabase directly with a user's own JWT (server-action
--     checks alone are bypassable by construction).
--  B) Users may READ their own moderation state (restriction/suspension)
--     so the interface can show accurate messages. Writes stay admin-only.
--  C) contact_messages: dependable contact-form storage with its own
--     rate limit and admin-only reading.
-- =====================================================================

-- ---------------------------------------------------------------------
-- A) Generic per-account rate-limit trigger.
--    Args: user-id column, max rows, window in seconds.
--    Raises 'rate_limit_exceeded' — the app maps this to friendly copy.
-- ---------------------------------------------------------------------
create or replace function public.community_rate_check()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  col text := tg_argv[0];
  max_rows int := tg_argv[1]::int;
  window_s int := tg_argv[2]::int;
  uid uuid;
  n int;
begin
  uid := (to_jsonb(new) ->> col)::uuid;
  if uid is null then return new; end if;
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at >= now() - make_interval(secs => %s)',
    tg_table_schema, tg_table_name, col, window_s
  ) into n using uid;
  if n >= max_rows then
    raise exception 'rate_limit_exceeded' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists rate_limit_posts on public.community_posts;
create trigger rate_limit_posts before insert on public.community_posts
  for each row execute function public.community_rate_check('author_id', '10', '3600');

drop trigger if exists rate_limit_comments on public.community_comments;
create trigger rate_limit_comments before insert on public.community_comments
  for each row execute function public.community_rate_check('author_id', '30', '3600');

drop trigger if exists rate_limit_follows on public.community_follows;
create trigger rate_limit_follows before insert on public.community_follows
  for each row execute function public.community_rate_check('follower_id', '60', '3600');

drop trigger if exists rate_limit_blocks on public.community_blocks;
create trigger rate_limit_blocks before insert on public.community_blocks
  for each row execute function public.community_rate_check('blocker_id', '20', '86400');

drop trigger if exists rate_limit_reports on public.community_reports;
create trigger rate_limit_reports before insert on public.community_reports
  for each row execute function public.community_rate_check('reporter_id', '10', '86400');

drop trigger if exists rate_limit_reactions on public.community_reactions;
create trigger rate_limit_reactions before insert on public.community_reactions
  for each row execute function public.community_rate_check('user_id', '240', '3600');

-- ---------------------------------------------------------------------
-- B) Own-row read access on moderation state (writes remain admin-only).
-- ---------------------------------------------------------------------
drop policy if exists cms_all on public.community_moderation_state;
create policy cms_admin_write on public.community_moderation_state for all
  using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));
drop policy if exists cms_self_read on public.community_moderation_state;
create policy cms_self_read on public.community_moderation_state for select
  using (user_id = auth.uid() or public.community_is_admin(auth.uid()));

-- ---------------------------------------------------------------------
-- C) Contact messages.
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  email      text not null check (char_length(email) between 5 and 200 and position('@' in email) > 1),
  category   text not null check (char_length(category) between 1 and 80),
  message    text not null check (char_length(message) between 10 and 4000),
  user_id    uuid references auth.users(id) on delete set null,
  status     text not null default 'new' check (status in ('new','handled')),
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_status_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (including signed-out visitors) may submit; nobody but admins reads.
drop policy if exists cm_insert on public.contact_messages;
create policy cm_insert on public.contact_messages for insert
  to anon, authenticated with check (true);
drop policy if exists cm_admin_select on public.contact_messages;
create policy cm_admin_select on public.contact_messages for select
  using (public.community_is_admin(auth.uid()));
drop policy if exists cm_admin_update on public.contact_messages;
create policy cm_admin_update on public.contact_messages for update
  using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));

-- Rate limit: 5 messages per hour per email address.
create or replace function public.contact_rate_check()
returns trigger language plpgsql security definer set search_path = public as $$
declare n int;
begin
  select count(*) into n from public.contact_messages
    where email = new.email and created_at >= now() - interval '1 hour';
  if n >= 5 then
    raise exception 'rate_limit_exceeded' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists rate_limit_contact on public.contact_messages;
create trigger rate_limit_contact before insert on public.contact_messages
  for each row execute function public.contact_rate_check();
