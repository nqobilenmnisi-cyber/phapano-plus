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

rollback;
