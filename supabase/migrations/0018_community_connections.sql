-- =====================================================================
-- Migration 0018 — Community connections and relationship notifications.
-- REQUIRES 0013 and 0015.
-- SAFE & RE-RUNNABLE. Existing follows and profiles are preserved.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Connection privacy belongs to the Community identity.
-- ---------------------------------------------------------------------
alter table public.community_profiles
  add column if not exists connection_permission text not null default 'everyone';

alter table public.community_profiles
  drop constraint if exists community_profiles_connection_permission_check;
alter table public.community_profiles
  add constraint community_profiles_connection_permission_check
  check (connection_permission in ('everyone', 'following', 'nobody'));

-- ---------------------------------------------------------------------
-- 2) One durable row per unordered pair.
--    Ended requests are retained so the same pair cannot repeatedly send
--    and cancel requests to evade the cooldown and rate limit.
-- ---------------------------------------------------------------------
create table if not exists public.community_connections (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'declined', 'cancelled', 'removed')),
  note         text check (note is null or char_length(note) <= 240),
  accepted_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (requester_id <> recipient_id),
  check (
    (status = 'accepted' and accepted_at is not null)
    or (status <> 'accepted' and accepted_at is null)
  )
);

create unique index if not exists community_connections_pair_idx
  on public.community_connections (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  );
create index if not exists community_connections_requester_idx
  on public.community_connections (requester_id, status, updated_at desc);
create index if not exists community_connections_recipient_idx
  on public.community_connections (recipient_id, status, updated_at desc);

alter table public.community_connections enable row level security;

-- Relationship rows are visible only to their two participants. Public
-- counts are exposed through a narrow SECURITY DEFINER function below.
drop policy if exists cconn_select on public.community_connections;
create policy cconn_select on public.community_connections for select using (
  (
    (requester_id = auth.uid() or recipient_id = auth.uid())
    and not public.community_blocked_between(requester_id, recipient_id)
  )
  or public.community_is_admin(auth.uid())
);

-- There are deliberately no direct INSERT, UPDATE or DELETE policies.
-- All state changes use the checked functions below.

-- The authoritative database rate limit also covers connection requests.
drop trigger if exists rate_limit_connections on public.community_connections;
create trigger rate_limit_connections
  before insert or update of status on public.community_connections
  for each row
  when (new.status = 'pending')
  execute function public.community_rate_check('requester_id', '30', '86400');

-- ---------------------------------------------------------------------
-- 3) Private notification helper.
-- ---------------------------------------------------------------------
-- Notifications existed in the original reference schema but not in the
-- numbered migration history. Re-assert the table here so this canonical
-- migration works in both established and fresh environments.
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
drop policy if exists "notifications_own" on public.notifications;
create policy notifications_own on public.notifications for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.community_notifications_enabled(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public as $$
  select coalesce(
    (
      select (notification_prefs ->> 'community')::boolean
      from public.profiles
      where id = target
    ),
    true
  );
$$;

create or replace function public.community_create_notification(
  target uuid,
  notification_title text,
  notification_body text,
  notification_link text
)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  if target is null
     or target = auth.uid()
     or not public.community_notifications_enabled(target)
  then
    return;
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (
    target,
    'community',
    left(notification_title, 160),
    nullif(left(trim(notification_body), 400), ''),
    left(notification_link, 300)
  );
end $$;

-- A follow creates a real in-app alert. Mutual follows created when a
-- connection is accepted are excluded to avoid three alerts for one action.
create or replace function public.community_notify_new_follow()
returns trigger
language plpgsql
security definer
set search_path = public as $$
declare
  follower_name text;
begin
  if exists (
    select 1
    from public.community_connections c
    where c.status = 'accepted'
      and (
        (c.requester_id = new.follower_id and c.recipient_id = new.followee_id)
        or
        (c.requester_id = new.followee_id and c.recipient_id = new.follower_id)
      )
  ) then
    return new;
  end if;

  select display_name into follower_name
  from public.community_profiles
  where user_id = new.follower_id;

  perform public.community_create_notification(
    new.followee_id,
    coalesce(follower_name, 'A Phapano+ member') || ' followed you',
    'They will now see updates you share with your followers.',
    '/app/community/member/' || new.follower_id::text
  );
  return new;
end $$;

drop trigger if exists notify_new_community_follow on public.community_follows;
create trigger notify_new_community_follow
  after insert on public.community_follows
  for each row execute function public.community_notify_new_follow();

-- ---------------------------------------------------------------------
-- 4) Public count, private state changes.
-- ---------------------------------------------------------------------
create or replace function public.community_connection_count(target uuid)
returns bigint
language sql
stable
security definer
set search_path = public as $$
  select count(*)
  from public.community_connections
  where status = 'accepted'
    and (requester_id = target or recipient_id = target);
$$;

create or replace function public.community_send_connection(
  target uuid,
  note_text text default null
)
returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  sender uuid := auth.uid();
  target_permission text;
  existing public.community_connections%rowtype;
  connection_id uuid;
  sender_name text;
  clean_note text := nullif(left(trim(coalesce(note_text, '')), 240), '');
begin
  if sender is null or target is null or sender = target then
    raise exception 'invalid_connection_target';
  end if;
  if not exists (
    select 1
    from public.community_profiles p
    where p.user_id = sender
      and not exists (
        select 1 from public.community_moderation_state s
        where s.user_id = sender and s.community_suspended
      )
  ) then
    raise exception 'connection_unavailable';
  end if;
  if public.community_blocked_between(sender, target) then
    raise exception 'connection_blocked';
  end if;

  select connection_permission into target_permission
  from public.community_profiles p
  where p.user_id = target
    and p.visibility <> 'hidden'
    and not exists (
      select 1 from public.community_moderation_state s
      where s.user_id = target and s.community_suspended
    );

  if target_permission is null then
    raise exception 'connection_unavailable';
  end if;
  if target_permission = 'nobody' then
    raise exception 'connection_not_allowed';
  end if;
  if target_permission = 'following' and not exists (
    select 1 from public.community_follows
    where follower_id = target and followee_id = sender
  ) then
    raise exception 'connection_not_allowed';
  end if;

  select * into existing
  from public.community_connections
  where (requester_id = sender and recipient_id = target)
     or (requester_id = target and recipient_id = sender)
  for update;

  if found and existing.status in ('pending', 'accepted') then
    raise exception 'connection_exists';
  end if;
  if found and existing.updated_at > now() - interval '24 hours' then
    raise exception 'connection_cooldown';
  end if;

  if found then
    update public.community_connections
    set requester_id = sender,
        recipient_id = target,
        status = 'pending',
        note = clean_note,
        accepted_at = null,
        created_at = now(),
        updated_at = now()
    where id = existing.id
    returning id into connection_id;
  else
    insert into public.community_connections (
      requester_id, recipient_id, note
    )
    values (sender, target, clean_note)
    returning id into connection_id;
  end if;

  select display_name into sender_name
  from public.community_profiles
  where user_id = sender;

  perform public.community_create_notification(
    target,
    coalesce(sender_name, 'A Phapano+ member') || ' wants to connect',
    'Review their connection request.',
    '/app/community/connections'
  );

  return connection_id;
exception
  when unique_violation then
    raise exception 'connection_exists';
end $$;

create or replace function public.community_respond_connection(
  connection_id uuid,
  accept_request boolean
)
returns void
language plpgsql
security definer
set search_path = public as $$
declare
  recipient uuid := auth.uid();
  request_row public.community_connections%rowtype;
  recipient_name text;
begin
  select * into request_row
  from public.community_connections
  where id = connection_id
    and recipient_id = recipient
    and status = 'pending'
  for update;

  if not found then
    raise exception 'connection_request_unavailable';
  end if;

  if not accept_request then
    update public.community_connections
    set status = 'declined', note = null, accepted_at = null, updated_at = now()
    where id = connection_id;
    return;
  end if;

  if public.community_blocked_between(request_row.requester_id, recipient) then
    raise exception 'connection_blocked';
  end if;

  update public.community_connections
  set status = 'accepted', note = null, accepted_at = now(), updated_at = now()
  where id = connection_id;

  -- A professional connection also follows both journeys. These follows stay
  -- independently controllable if either person later chooses to unfollow.
  insert into public.community_follows (follower_id, followee_id)
  values
    (request_row.requester_id, recipient),
    (recipient, request_row.requester_id)
  on conflict do nothing;

  select display_name into recipient_name
  from public.community_profiles
  where user_id = recipient;

  perform public.community_create_notification(
    request_row.requester_id,
    coalesce(recipient_name, 'A Phapano+ member') || ' accepted your connection',
    'You are now connected on Phapano+.',
    '/app/community/member/' || recipient::text
  );
end $$;

create or replace function public.community_cancel_connection(connection_id uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  update public.community_connections
  set status = 'cancelled', note = null, accepted_at = null, updated_at = now()
  where id = connection_id
    and requester_id = auth.uid()
    and status = 'pending';

  if not found then
    raise exception 'connection_request_unavailable';
  end if;
end $$;

create or replace function public.community_remove_connection(connection_id uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  update public.community_connections
  set status = 'removed', note = null, accepted_at = null, updated_at = now()
  where id = connection_id
    and status = 'accepted'
    and (requester_id = auth.uid() or recipient_id = auth.uid());

  if not found then
    raise exception 'connection_unavailable';
  end if;
end $$;

-- Blocking is authoritative across follows and connections.
create or replace function public.community_block_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public as $$
begin
  if auth.uid() is null or target is null or target = auth.uid() then
    raise exception 'invalid block target';
  end if;

  insert into public.community_blocks (blocker_id, blocked_id)
  values (auth.uid(), target)
  on conflict do nothing;

  delete from public.community_follows
  where (follower_id = auth.uid() and followee_id = target)
     or (follower_id = target and followee_id = auth.uid());

  update public.community_connections
  set status = 'removed', note = null, accepted_at = null, updated_at = now()
  where (requester_id = auth.uid() and recipient_id = target)
     or (requester_id = target and recipient_id = auth.uid());
end $$;

-- Keep helper functions private except for the narrow operations the
-- authenticated application needs.
revoke all on function public.community_notifications_enabled(uuid) from public;
revoke all on function public.community_create_notification(uuid, text, text, text) from public;
revoke all on function public.community_notify_new_follow() from public;

revoke all on function public.community_connection_count(uuid) from public;
grant execute on function public.community_connection_count(uuid) to authenticated;

revoke all on function public.community_send_connection(uuid, text) from public;
grant execute on function public.community_send_connection(uuid, text) to authenticated;

revoke all on function public.community_respond_connection(uuid, boolean) from public;
grant execute on function public.community_respond_connection(uuid, boolean) to authenticated;

revoke all on function public.community_cancel_connection(uuid) from public;
grant execute on function public.community_cancel_connection(uuid) to authenticated;

revoke all on function public.community_remove_connection(uuid) from public;
grant execute on function public.community_remove_connection(uuid) to authenticated;
