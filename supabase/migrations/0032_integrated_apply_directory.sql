-- =====================================================================
-- Migration 0032 — one actionable Apply directory.
--
-- Materialises every verified catalogue level in `programmes` so the same
-- row can power discovery, bookmarks, private notes and application plans.
-- Existing Honours/Master's row ids are preserved through their stable slugs.
-- Hidden legacy rows and every saved_programmes record remain untouched.
-- =====================================================================

begin;

-- Fail closed if migration 0031 has not populated the complete audit.
do $$
begin
  if (select count(*) from public.psychology_university_catalogue where is_published) <> 26 then
    raise exception 'Migration 0031 must be applied before 0032';
  end if;
end $$;

-- Hide previously materialised audit rows before republishing the current
-- verified set. This makes a future re-run safe if an official offering is
-- withdrawn, without deleting saved plans that referenced the older row.
update public.programmes
set is_published = false,
    updated_at = now()
where slug like 'audit-%'
  and qualification in ('undergraduate', 'honours', 'masters', 'doctoral');

insert into public.programmes
  (slug, institution, institution_url, qualification, stream, province, status,
   programme_title, programme_url, primary_source_url, last_verified,
   last_checked, needs_review, verification_status, is_published)
select
  'audit-' || catalogue.slug || '-' || level.key,
  catalogue.institution,
  catalogue.institution_url,
  level.key,
  case when level.key = 'masters' then 'other' else null end,
  catalogue.province,
  'dates_not_confirmed',
  catalogue.levels #>> array[level.key, 'title'],
  catalogue.levels #>> array[level.key, 'url'],
  catalogue.levels #>> array[level.key, 'url'],
  catalogue.last_verified,
  now(),
  false,
  'verified',
  true
from public.psychology_university_catalogue catalogue
cross join lateral (
  values ('undergraduate'), ('honours'), ('masters'), ('doctoral')
) as level(key)
where catalogue.is_published
  and catalogue.levels #>> array[level.key, 'status'] = 'offered'
on conflict (slug) do update set
  institution = excluded.institution,
  institution_url = excluded.institution_url,
  qualification = excluded.qualification,
  stream = excluded.stream,
  province = excluded.province,
  status = excluded.status,
  programme_title = excluded.programme_title,
  programme_url = excluded.programme_url,
  primary_source_url = excluded.primary_source_url,
  last_verified = excluded.last_verified,
  last_checked = excluded.last_checked,
  needs_review = excluded.needs_review,
  verification_status = excluded.verification_status,
  is_published = excluded.is_published,
  updated_at = now();

-- The public planner and the audited catalogue must always reconcile.
do $$
begin
  if (select count(*) from public.programmes where is_published and verification_status = 'verified') <> 72 then
    raise exception 'Integrated Apply directory must contain exactly 72 verified programme levels';
  end if;
  if (select count(*) from public.programmes where is_published and qualification = 'undergraduate') <> 19 then
    raise exception 'Integrated Apply directory must contain 19 undergraduate routes';
  end if;
  if (select count(*) from public.programmes where is_published and qualification = 'honours') <> 19 then
    raise exception 'Integrated Apply directory must contain 19 Honours routes';
  end if;
  if (select count(*) from public.programmes where is_published and qualification = 'masters') <> 18 then
    raise exception 'Integrated Apply directory must contain 18 Master''s routes';
  end if;
  if (select count(*) from public.programmes where is_published and qualification = 'doctoral') <> 16 then
    raise exception 'Integrated Apply directory must contain 16 doctoral routes';
  end if;
  if exists (
    select 1 from public.programmes
    where is_published and verification_status = 'verified'
      and (programme_title is null or programme_url not like 'https://%')
  ) then
    raise exception 'Every published Apply row must have a title and official HTTPS source';
  end if;
end $$;

commit;

-- Verification SQL:
-- select qualification, count(*) from public.programmes
-- where is_published and verification_status = 'verified'
-- group by qualification order by qualification;
-- select count(distinct institution) from public.programmes
-- where is_published and verification_status = 'verified';
