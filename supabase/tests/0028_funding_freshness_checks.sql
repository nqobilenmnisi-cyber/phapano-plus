-- Verification checks for migration 0028. Run after applying the migration.
do $$
declare
  active_verified integer;
  queue_exists boolean;
begin
  select count(*) into active_verified
  from public.funding_opportunities
  where is_published
    and is_open
    and status = 'verified'
    and source_url is not null;

  if active_verified < 10 then
    raise exception 'Expected at least 10 active, verified official-source opportunities; found %', active_verified;
  end if;

  if exists (
    select 1 from public.funding_opportunities
    where is_published and is_open and closing_date < current_date
  ) then
    raise exception 'An expired opportunity is still marked open';
  end if;

  select to_regclass('public.funding_updates') is not null into queue_exists;
  if not queue_exists then
    raise exception 'funding_updates review queue is missing';
  end if;

  if not exists (
    select 1 from public.funding_opportunities
    where slug = 'nrf-honours'
      and closing_date = date '2026-11-23'
      and source_url like 'https://www.nrf.ac.za/%'
  ) then
    raise exception 'The current NRF Honours call is missing or incorrect';
  end if;

  if not exists (
    select 1 from public.funding_opportunities
    where slug = 'canon-collins'
      and closing_date = date '2026-08-14'
      and source_url like 'https://canoncollins.org/%'
  ) then
    raise exception 'The current Canon Collins call is missing or incorrect';
  end if;
end $$;

select
  slug,
  title,
  closing_date,
  is_open,
  status,
  last_verified_at,
  source_url
from public.funding_opportunities
where is_published and is_open
order by closing_date nulls last, title;
