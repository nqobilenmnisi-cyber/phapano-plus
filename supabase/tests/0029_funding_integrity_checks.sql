-- Post-migration verification for migration 0029.
do $$
declare
  unsafe_count integer;
  published_count integer;
  broken_link_count integer;
begin
  select count(*) into published_count
  from public.funding_opportunities
  where is_published;

  if published_count <> 6 then
    raise exception 'Expected exactly 6 audited public funding records, found %', published_count;
  end if;

  select count(*) into unsafe_count
  from public.funding_opportunities
  where is_published
    and slug not in (
      'nrf-honours',
      'ninety-one-changeblazers-2027',
      'rhodes-postgraduate-scholarship-2027',
      'omt',
      'uct-postgraduate-financial-aid-2027',
      'mmeg-south-africa-2027'
    );

  if unsafe_count <> 0 then
    raise exception 'Found % unaudited public funding records', unsafe_count;
  end if;

  select count(*) into broken_link_count
  from public.funding_opportunities
  where is_published
    and (
      source_url is null
      or source_url !~ '^https://'
      or link is null
      or link !~ '^https://'
    );

  if broken_link_count <> 0 then
    raise exception 'Found % public funding records without HTTPS official links', broken_link_count;
  end if;
end $$;

select slug, title, field_relevance, closing_date, source_url
from public.funding_opportunities
where is_published
order by closing_date nulls last, title;
