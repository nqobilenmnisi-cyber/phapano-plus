-- =====================================================================
-- Migration 0014 — Community Lite data lifecycle (account deletion).
-- REQUIRES 0013. SAFE & RE-RUNNABLE. Non-destructive: only relaxes
-- NOT NULL on two report columns and changes four FK delete rules.
--
-- WHY: delete_own_account() removes the auth.users row and relies on
-- cascades. Under 0013 alone, deleting an account also deleted every
-- report filed AGAINST it and its moderation log — meaning a user could
-- erase moderation evidence by deleting and re-registering.
--
-- LIFECYCLE POLICY (POPIA-aligned):
--  DELETED with the account (right-to-erasure, cascades unchanged):
--    community profile, posts, comments, reactions, follows, blocks,
--    guidelines acceptances.
--  RETAINED ANONYMISED (legitimate-interest: platform safety/audit):
--    reports (reporter and reported references become NULL; category,
--    excerpt snapshot and moderator notes remain), moderation actions
--    (actor/target references become NULL; the action log remains).
--  No orphans: feeds join content via cascading FKs, so nothing broken
--  is ever displayed; retained reports/actions live only in admin views,
--  which already render a fallback name for missing accounts.
-- =====================================================================

-- Reports: keep the record, drop the personal link, when either party leaves.
alter table public.community_reports
  alter column reporter_id drop not null;
alter table public.community_reports
  alter column target_user_id drop not null;

alter table public.community_reports
  drop constraint if exists community_reports_reporter_id_fkey;
alter table public.community_reports
  add constraint community_reports_reporter_id_fkey
  foreign key (reporter_id) references auth.users(id) on delete set null;

alter table public.community_reports
  drop constraint if exists community_reports_target_user_id_fkey;
alter table public.community_reports
  add constraint community_reports_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete set null;

-- Moderation actions: the audit trail survives any account deletion.
alter table public.community_moderation_actions
  alter column admin_id drop not null;
alter table public.community_moderation_actions
  drop constraint if exists community_moderation_actions_admin_id_fkey;
alter table public.community_moderation_actions
  add constraint community_moderation_actions_admin_id_fkey
  foreign key (admin_id) references auth.users(id) on delete set null;

alter table public.community_moderation_actions
  drop constraint if exists community_moderation_actions_target_user_id_fkey;
alter table public.community_moderation_actions
  add constraint community_moderation_actions_target_user_id_fkey
  foreign key (target_user_id) references auth.users(id) on delete set null;

-- Reports RLS still requires reporter_id = auth.uid() to read own reports;
-- NULL reporter rows are therefore visible to admins only. No policy change
-- needed, but we re-assert the insert policy requires a real reporter.
drop policy if exists crep_insert on public.community_reports;
create policy crep_insert on public.community_reports for insert
  with check (reporter_id = auth.uid() and reporter_id is not null);
