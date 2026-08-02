begin;

select has_function(
  'public',
  'refresh_pathway_notifications',
  array[]::name[],
  'stage-relevant pathway notification refresh exists'
);

select function_privs_are(
  'public',
  'refresh_pathway_notifications',
  array[]::name[],
  'authenticated',
  array['EXECUTE'],
  'only signed-in members can refresh their pathway notifications'
);

select ok(
  not has_function_privilege('anon', 'public.refresh_pathway_notifications()', 'EXECUTE'),
  'anonymous visitors cannot create funding notifications'
);

rollback;
