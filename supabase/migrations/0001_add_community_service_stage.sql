-- Migration 0001 (safe): add the "community service psychologist" stage.
-- Type-guarded so it never errors if the career_stage enum doesn't exist
-- (in that case career_stage is a plain text column and no change is needed).
-- Safe to run more than once.

do $$
begin
  if exists (select 1 from pg_type where typname = 'career_stage') then
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'career_stage' and e.enumlabel = 'community_service'
    ) then
      alter type career_stage add value 'community_service';
    end if;
  end if;
end $$;
