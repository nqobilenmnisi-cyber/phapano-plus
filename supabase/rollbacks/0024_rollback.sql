-- Rollback for migration 0024.
-- Website prefixes are intentionally retained because they are valid URLs.
-- Reapply migration 0020 after this rollback if account deletion is required.

drop function if exists public.delete_own_account();
notify pgrst, 'reload schema';
