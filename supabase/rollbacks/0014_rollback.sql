-- Rollback for 0014 (restores 0013 delete rules). NOTE: the two
-- SET NOT NULL statements fail if anonymised (NULL) rows exist —
-- delete those rows first if you truly need the original constraints.
alter table public.community_reports
  drop constraint if exists community_reports_reporter_id_fkey;
alter table public.community_reports
  add constraint community_reports_reporter_id_fkey
  foreign key (reporter_id) references auth.users(id) on delete cascade;
alter table public.community_reports
  drop constraint if exists community_reports_target_user_id_fkey;
alter table public.community_reports
  add constraint community_reports_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete cascade;
alter table public.community_moderation_actions
  drop constraint if exists community_moderation_actions_admin_id_fkey;
alter table public.community_moderation_actions
  add constraint community_moderation_actions_admin_id_fkey
  foreign key (admin_id) references auth.users(id) on delete cascade;
alter table public.community_moderation_actions
  drop constraint if exists community_moderation_actions_target_user_id_fkey;
alter table public.community_moderation_actions
  add constraint community_moderation_actions_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete cascade;
-- delete from public.community_reports where reporter_id is null or target_user_id is null;
-- alter table public.community_reports alter column reporter_id set not null;
-- alter table public.community_reports alter column target_user_id set not null;
-- alter table public.community_moderation_actions alter column admin_id set not null;
