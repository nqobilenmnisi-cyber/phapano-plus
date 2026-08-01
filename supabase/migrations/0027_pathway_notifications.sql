-- =====================================================================
-- Migration 0027 — Working deadline and funding notifications.
--
-- Notifications are refreshed when a signed-in member opens Phapano+.
-- Each reminder has a stable dedupe key, so refreshes never create noise.
-- Preferences remain private and are honoured before anything is inserted.
-- =====================================================================

create or replace function public.refresh_pathway_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid := auth.uid();
  deadline_alerts_enabled boolean := true;
  funding_alerts_enabled boolean := true;
  target_stage text;
begin
  if target_user is null then
    return;
  end if;

  select
    coalesce((notification_prefs ->> 'deadlines')::boolean, true),
    coalesce((notification_prefs ->> 'funding')::boolean, true),
    career_stage::text
  into deadline_alerts_enabled, funding_alerts_enabled, target_stage
  from public.profiles
  where id = target_user;

  if deadline_alerts_enabled then
    insert into public.notifications (
      user_id, type, title, body, link, dedupe_key
    )
    select
      target_user,
      'deadline',
      left(p.institution || ' deadline in ' ||
        (coalesce(sp.my_deadline, p.closing_date) - current_date)::text ||
        case when coalesce(sp.my_deadline, p.closing_date) - current_date = 1
          then ' day' else ' days' end, 160),
      'Your saved application deadline is approaching.',
      '/app/apply/programme/' || p.id::text,
      'deadline:programme:' || sp.id::text || ':' ||
        coalesce(sp.my_deadline, p.closing_date)::text
    from public.saved_programmes sp
    join public.programmes p on p.id = sp.programme_id
    where sp.user_id = target_user
      and coalesce(sp.my_deadline, p.closing_date) between current_date and current_date + 7
      and not exists (
        select 1 from public.notifications n
        where n.user_id = target_user
          and n.dedupe_key = 'deadline:programme:' || sp.id::text || ':' ||
            coalesce(sp.my_deadline, p.closing_date)::text
      );

    insert into public.notifications (
      user_id, type, title, body, link, dedupe_key
    )
    select
      target_user,
      'deadline',
      left('Note due in ' || (j.due_date - current_date)::text ||
        case when j.due_date - current_date = 1 then ' day' else ' days' end, 160),
      left(j.content, 400),
      '/app/journal',
      'deadline:note:' || j.id::text || ':' || j.due_date::text
    from public.journal_entries j
    where j.user_id = target_user
      and j.due_date between current_date and current_date + 7
      and not exists (
        select 1 from public.notifications n
        where n.user_id = target_user
          and n.dedupe_key = 'deadline:note:' || j.id::text || ':' || j.due_date::text
      );

    insert into public.notifications (
      user_id, type, title, body, link, dedupe_key
    )
    select
      target_user,
      'deadline',
      left(f.title || ' closes in ' || (f.closing_date - current_date)::text ||
        case when f.closing_date - current_date = 1 then ' day' else ' days' end, 160),
      'A funding deadline you saved is approaching.',
      '/app/funding/' || f.id::text,
      'deadline:funding:' || sf.id::text || ':' || f.closing_date::text
    from public.saved_funding sf
    join public.funding_opportunities f on f.id = sf.funding_id
    where sf.user_id = target_user
      and f.closing_date between current_date and current_date + 7
      and not exists (
        select 1 from public.notifications n
        where n.user_id = target_user
          and n.dedupe_key = 'deadline:funding:' || sf.id::text || ':' || f.closing_date::text
      );
  end if;

  if funding_alerts_enabled then
    insert into public.notifications (
      user_id, type, title, body, link, dedupe_key
    )
    select
      target_user,
      'funding',
      left('New funding: ' || f.title, 160),
      left(coalesce(f.amount_description, f.description, 'A new funding opportunity is available.'), 400),
      '/app/funding/' || f.id::text,
      'new-funding:' || f.id::text
    from public.funding_opportunities f
    where f.is_published = true
      and f.created_at >= now() - interval '7 days'
      and (
        coalesce(array_length(f.relevant_stages, 1), 0) = 0
        or target_stage = any(f.relevant_stages::text[])
      )
      and not exists (
        select 1 from public.notifications n
        where n.user_id = target_user
          and n.dedupe_key = 'new-funding:' || f.id::text
      );
  end if;
end;
$$;

revoke all on function public.refresh_pathway_notifications() from public;
revoke all on function public.refresh_pathway_notifications() from anon;
grant execute on function public.refresh_pathway_notifications() to authenticated;

notify pgrst, 'reload schema';
