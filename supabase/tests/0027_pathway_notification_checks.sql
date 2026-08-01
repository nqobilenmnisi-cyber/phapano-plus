begin;

select has_function(
  'public',
  'refresh_pathway_notifications',
  array[]::name[],
  'pathway notification refresh function exists'
);

select function_privs_are(
  'public',
  'refresh_pathway_notifications',
  array[]::name[],
  'authenticated',
  array['EXECUTE'],
  'signed-in members can refresh only their own pathway notifications'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.refresh_pathway_notifications()',
    'EXECUTE'
  ),
  'anonymous visitors cannot refresh pathway notifications'
);

rollback;
