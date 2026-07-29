-- Rollback for migration 0020.
-- Restores the former Community bio limit and removes the migrated RPC.

drop function if exists public.delete_own_account();

alter table public.community_profiles
  drop constraint if exists community_profiles_bio_check;
alter table public.community_profiles
  add constraint community_profiles_bio_check
  check (bio is null or char_length(bio) <= 280) not valid;
