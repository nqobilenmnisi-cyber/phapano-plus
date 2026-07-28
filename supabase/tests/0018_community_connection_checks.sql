-- Run after migration 0018. The final query should return eight rows.

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'community_connections'
  and column_name in (
    'id',
    'requester_id',
    'recipient_id',
    'status',
    'note',
    'accepted_at'
  )

union all

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'community_profiles'
  and column_name = 'connection_permission'

union all

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'notifications'

order by column_name;
