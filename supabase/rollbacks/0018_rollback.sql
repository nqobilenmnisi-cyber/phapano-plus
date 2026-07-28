-- Rollback for migration 0018.
-- Removes connection data and restores the pre-0018 blocking function.

drop trigger if exists notify_new_community_follow on public.community_follows;
drop trigger if exists rate_limit_connections on public.community_connections;

drop function if exists public.community_notify_new_follow();
drop function if exists public.community_create_notification(uuid, text, text, text);
drop function if exists public.community_notifications_enabled(uuid);
drop function if exists public.community_connection_count(uuid);
drop function if exists public.community_send_connection(uuid, text);
drop function if exists public.community_respond_connection(uuid, boolean);
drop function if exists public.community_cancel_connection(uuid);
drop function if exists public.community_remove_connection(uuid);

drop table if exists public.community_connections cascade;

alter table public.community_profiles
  drop constraint if exists community_profiles_connection_permission_check;
alter table public.community_profiles
  drop column if exists connection_permission;

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
