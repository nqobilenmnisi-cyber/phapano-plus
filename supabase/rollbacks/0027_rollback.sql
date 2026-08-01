revoke all on function public.refresh_pathway_notifications() from authenticated;
drop function if exists public.refresh_pathway_notifications();
notify pgrst, 'reload schema';
