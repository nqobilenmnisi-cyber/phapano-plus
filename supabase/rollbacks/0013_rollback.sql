-- Full rollback for 0013 + 0014: removes ALL Community Lite objects and data.
-- DESTRUCTIVE for community data only. Touches nothing outside community_*.
drop table if exists
  public.community_moderation_actions,
  public.community_reports,
  public.community_terms_acceptances,
  public.community_reactions,
  public.community_comments,
  public.community_posts,
  public.community_follows,
  public.community_blocks,
  public.community_moderation_state,
  public.community_profiles
cascade;
drop function if exists
  public.community_is_admin(uuid),
  public.community_blocked_between(uuid,uuid),
  public.community_has_blocked(uuid,uuid),
  public.community_accepted_terms(uuid),
  public.community_can_post(uuid),
  public.community_follow_counts(uuid),
  public.community_block_user(uuid),
  public.community_unblock_user(uuid);
