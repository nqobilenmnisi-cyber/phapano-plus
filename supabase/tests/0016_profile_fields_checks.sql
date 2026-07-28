-- Verification for migration 0016.
-- The first query must return exactly three rows.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'community_profiles'
  and column_name in ('headline', 'stage_other', 'stream_other')
order by column_name;

-- The second query must return exactly five rows.
select constraint_name
from information_schema.table_constraints
where table_schema = 'public'
  and table_name = 'community_profiles'
  and constraint_name in (
    'community_profiles_headline_length',
    'community_profiles_stage_other_length',
    'community_profiles_stream_other_length',
    'community_profiles_stage_other_consistency',
    'community_profiles_stream_other_consistency'
  )
order by constraint_name;
