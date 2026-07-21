-- Rollback for 0015. Removes triggers, contact storage and restores the
-- 0013 moderation-state policy (admin-only, no self-read).
drop trigger if exists rate_limit_posts on public.community_posts;
drop trigger if exists rate_limit_comments on public.community_comments;
drop trigger if exists rate_limit_follows on public.community_follows;
drop trigger if exists rate_limit_blocks on public.community_blocks;
drop trigger if exists rate_limit_reports on public.community_reports;
drop trigger if exists rate_limit_reactions on public.community_reactions;
drop function if exists public.community_rate_check();
drop table if exists public.contact_messages cascade;
drop function if exists public.contact_rate_check();
drop policy if exists cms_admin_write on public.community_moderation_state;
drop policy if exists cms_self_read on public.community_moderation_state;
create policy cms_all on public.community_moderation_state for all
  using (public.community_is_admin(auth.uid()))
  with check (public.community_is_admin(auth.uid()));
