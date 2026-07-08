-- Migration 0002 (safe): support Honours applicants and the custom "Other"
-- stage. Type-guarded so it never errors if the career_stage enum doesn't
-- exist (then career_stage is plain text and accepts the value directly).
-- Safe to run more than once.

do $$
begin
  if exists (select 1 from pg_type where typname = 'career_stage') then
    if not exists (
      select 1 from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'career_stage' and e.enumlabel = 'honours_applicant'
    ) then
      alter type career_stage add value 'honours_applicant';
    end if;
  end if;
end $$;

-- Free-text field for users who pick "Other" (safe regardless of enum).
alter table public.profiles
  add column if not exists career_stage_other text;
