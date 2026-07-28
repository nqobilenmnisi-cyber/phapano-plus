-- Verification for migration 0017.
-- The first query must return exactly one row with is_nullable = NO.
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'saved_programmes'
  and column_name = 'is_saved';

-- The second query must return exactly one row.
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'saved_programmes'
  and indexname = 'idx_saved_programmes_user_bookmarks';
