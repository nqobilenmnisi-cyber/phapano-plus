-- =====================================================================
-- Migration 0021 — Official organisation pages and profile verification.
-- Requires migrations 0013, 0018 and 0020.
-- Safe to re-run. The identity conversion is exact-email scoped.
-- =====================================================================

create table if not exists public.organisation_pages (
  id              uuid primary key references auth.users(id) on delete restrict,
  slug            text not null unique
                  check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name            text not null check (char_length(trim(name)) between 2 and 100),
  page_type       text not null default 'organisation'
                  check (page_type in ('organisation', 'initiative')),
  parent_page_id  uuid references public.organisation_pages(id) on delete set null,
  tagline         text check (tagline is null or char_length(tagline) <= 180),
  about           text check (about is null or char_length(about) <= 2000),
  focus_areas     text[] not null default '{}',
  services        text[] not null default '{}',
  location        text check (location is null or char_length(location) <= 120),
  contact_email   text,
  website_url     text,
  avatar_url      text,
  is_official     boolean not null default false,
  status          text not null default 'active'
                  check (status in ('active', 'retired')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.organisation_page_admins (
  page_id     uuid not null references public.organisation_pages(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'editor'
              check (role in ('owner', 'admin', 'editor')),
  created_at  timestamptz not null default now(),
  primary key (page_id, user_id)
);

create table if not exists public.profile_verifications (
  user_id      uuid not null references auth.users(id) on delete cascade,
  badge        text not null check (badge in ('verified_person', 'founder')),
  verified_at  timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  primary key (user_id, badge)
);

create index if not exists organisation_pages_status_name_idx
  on public.organisation_pages (status, name);
create index if not exists organisation_page_admins_user_idx
  on public.organisation_page_admins (user_id, page_id);

alter table public.organisation_pages enable row level security;
alter table public.organisation_page_admins enable row level security;
alter table public.profile_verifications enable row level security;

drop policy if exists organisation_pages_read on public.organisation_pages;
create policy organisation_pages_read on public.organisation_pages for select
  to authenticated
  using (
    status = 'active'
    or exists (
      select 1 from public.organisation_page_admins a
      where a.page_id = organisation_pages.id and a.user_id = auth.uid()
    )
    or public.community_is_admin(auth.uid())
  );

drop policy if exists organisation_pages_admin_update on public.organisation_pages;
create policy organisation_pages_admin_update on public.organisation_pages for update
  to authenticated
  using (
    exists (
      select 1 from public.organisation_page_admins a
      where a.page_id = organisation_pages.id and a.user_id = auth.uid()
    )
    or public.community_is_admin(auth.uid())
  )
  with check (
    exists (
      select 1 from public.organisation_page_admins a
      where a.page_id = organisation_pages.id and a.user_id = auth.uid()
    )
    or public.community_is_admin(auth.uid())
  );

drop policy if exists organisation_page_admins_read on public.organisation_page_admins;
create policy organisation_page_admins_read on public.organisation_page_admins
  for select to authenticated
  using (user_id = auth.uid() or public.community_is_admin(auth.uid()));

drop policy if exists profile_verifications_read on public.profile_verifications;
create policy profile_verifications_read on public.profile_verifications
  for select to authenticated using (true);

grant select on public.organisation_pages to authenticated;
revoke insert, delete on public.organisation_pages from authenticated;
revoke update on public.organisation_pages from authenticated;
grant update (
  name, tagline, about, focus_areas, services, location, contact_email,
  website_url, avatar_url, updated_at
) on public.organisation_pages to authenticated;
grant select on public.organisation_page_admins to authenticated;
revoke insert, update, delete on public.organisation_page_admins from authenticated;
grant select on public.profile_verifications to authenticated;
revoke insert, update, delete on public.profile_verifications from authenticated;

-- Organisation pages are follow-only identities. This trigger is the
-- database-level guard, including callers that bypass the application UI.
create or replace function public.community_reject_organisation_connection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'pending' and exists (
    select 1 from public.organisation_pages p
    where p.status = 'active'
      and p.id in (new.requester_id, new.recipient_id)
  ) then
    raise exception 'connection_not_allowed';
  end if;
  return new;
end
$$;

drop trigger if exists reject_organisation_connection
  on public.community_connections;
create trigger reject_organisation_connection
  before insert or update of status on public.community_connections
  for each row execute function public.community_reject_organisation_connection();

-- Keep a private, reversible record of only the four explicitly approved
-- identities. Nothing in this schema is exposed through the public API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.organisation_identity_account_backup (
  migration_key       text not null,
  email               text not null,
  user_id             uuid not null,
  banned_until        timestamptz,
  profile_row         jsonb,
  community_row       jsonb,
  created_at          timestamptz not null default now(),
  primary key (migration_key, email)
);

create table if not exists private.organisation_identity_relation_backup (
  migration_key  text not null,
  relation_name  text not null,
  row_id         text not null,
  row_data       jsonb not null,
  created_at     timestamptz not null default now(),
  primary key (migration_key, relation_name, row_id)
);

do $$
declare
  migration constant text := '0021-phapano-organisations-v1';
  founder uuid;
  info_page uuid;
  duplicate_info uuid;
  workshops_page uuid;
begin
  select id into founder
  from auth.users where lower(email) = 'nqobiimnisi@gmail.com';
  select id into info_page
  from auth.users where lower(email) = 'info@phapano.com';
  select id into duplicate_info
  from auth.users where lower(email) = 'phapanothedifference@gmail.com';
  select id into workshops_page
  from auth.users where lower(email) = 'workshops@phapano.com';

  -- Fresh/local databases may not contain these production identities. The
  -- schema still installs; conversion runs automatically where all four exist.
  if founder is null or info_page is null or duplicate_info is null
     or workshops_page is null then
    raise notice '0021 identity conversion skipped: one or more exact target emails are absent';
    return;
  end if;

  if (select count(*) from auth.users where lower(email) in (
    'nqobiimnisi@gmail.com',
    'info@phapano.com',
    'phapanothedifference@gmail.com',
    'workshops@phapano.com'
  )) <> 4 then
    raise exception '0021 identity conversion stopped: exact target email resolution is ambiguous';
  end if;

  insert into private.organisation_identity_account_backup (
    migration_key, email, user_id, banned_until, profile_row, community_row
  )
  select
    migration,
    lower(u.email),
    u.id,
    u.banned_until,
    to_jsonb(p),
    to_jsonb(cp)
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.community_profiles cp on cp.user_id = u.id
  where u.id in (founder, info_page, duplicate_info, workshops_page)
  on conflict (migration_key, email) do nothing;

  insert into private.organisation_identity_relation_backup (
    migration_key, relation_name, row_id, row_data
  )
  select migration, 'community_posts', p.id::text, to_jsonb(p)
  from public.community_posts p
  where p.author_id in (founder, info_page, duplicate_info, workshops_page)
  on conflict do nothing;

  insert into private.organisation_identity_relation_backup (
    migration_key, relation_name, row_id, row_data
  )
  select migration, 'community_comments', c.id::text, to_jsonb(c)
  from public.community_comments c
  where c.author_id in (founder, info_page, duplicate_info, workshops_page)
  on conflict do nothing;

  insert into private.organisation_identity_relation_backup (
    migration_key, relation_name, row_id, row_data
  )
  select migration, 'community_reactions',
         r.post_id::text || ':' || r.user_id::text, to_jsonb(r)
  from public.community_reactions r
  where r.user_id in (founder, info_page, duplicate_info, workshops_page)
  on conflict do nothing;

  insert into private.organisation_identity_relation_backup (
    migration_key, relation_name, row_id, row_data
  )
  select migration, 'community_follows',
         f.follower_id::text || ':' || f.followee_id::text, to_jsonb(f)
  from public.community_follows f
  where f.follower_id in (founder, info_page, duplicate_info, workshops_page)
     or f.followee_id in (founder, info_page, duplicate_info, workshops_page)
  on conflict do nothing;

  insert into private.organisation_identity_relation_backup (
    migration_key, relation_name, row_id, row_data
  )
  select migration, 'community_connections', c.id::text, to_jsonb(c)
  from public.community_connections c
  where c.requester_id in (founder, info_page, duplicate_info, workshops_page)
     or c.recipient_id in (founder, info_page, duplicate_info, workshops_page)
  on conflict do nothing;

  insert into private.organisation_identity_relation_backup (
    migration_key, relation_name, row_id, row_data
  )
  select migration, 'community_blocks',
         b.blocker_id::text || ':' || b.blocked_id::text, to_jsonb(b)
  from public.community_blocks b
  where b.blocker_id in (founder, info_page, duplicate_info, workshops_page)
     or b.blocked_id in (founder, info_page, duplicate_info, workshops_page)
  on conflict do nothing;

  insert into public.profile_verifications (user_id, badge)
  values
    (founder, 'verified_person'),
    (founder, 'founder')
  on conflict do nothing;

  insert into public.organisation_pages (
    id, slug, name, page_type, tagline, about, focus_areas, services,
    location, contact_email, website_url, avatar_url, is_official, status
  )
  select
    info_page,
    'phapano',
    'Phapano - The Difference',
    'organisation',
    'Supporting psychology students and emerging professionals across South Africa.',
    coalesce(
      nullif(trim(cp.bio), ''),
      nullif(trim(p.bio), ''),
      'Supporting psychology students and emerging professionals through mentorship, resources, opportunities and community across South Africa.'
    ),
    array['Psychology pathways', 'Mentorship', 'Professional development'],
    array['Resources', 'Opportunities', 'Community support'],
    'South Africa',
    'info@phapano.com',
    'https://phapano.com',
    coalesce(cp.avatar_url, p.avatar_url),
    true,
    'active'
  from public.profiles p
  left join public.community_profiles cp on cp.user_id = p.id
  where p.id = info_page
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    page_type = excluded.page_type,
    tagline = excluded.tagline,
    about = excluded.about,
    focus_areas = excluded.focus_areas,
    services = excluded.services,
    location = excluded.location,
    contact_email = excluded.contact_email,
    website_url = excluded.website_url,
    avatar_url = coalesce(organisation_pages.avatar_url, excluded.avatar_url),
    is_official = true,
    status = 'active',
    updated_at = now();

  insert into public.organisation_pages (
    id, slug, name, page_type, parent_page_id, tagline, about, focus_areas,
    services, location, contact_email, website_url, avatar_url, is_official,
    status
  )
  select
    workshops_page,
    'phapano-workshops',
    'Phapano Workshops',
    'initiative',
    info_page,
    'Practical workshops for psychology students and emerging professionals.',
    'The official Phapano Workshops page for learning events, application support and professional development.',
    array['Psychology education', 'Application support', 'Professional development'],
    array['Workshops', 'Learning events', 'Practical resources'],
    'South Africa',
    'workshops@phapano.com',
    'https://phapano.com',
    coalesce(cp.avatar_url, p.avatar_url),
    true,
    'active'
  from public.profiles p
  left join public.community_profiles cp on cp.user_id = p.id
  where p.id = workshops_page
  on conflict (id) do update set
    slug = excluded.slug,
    name = excluded.name,
    page_type = excluded.page_type,
    parent_page_id = excluded.parent_page_id,
    tagline = excluded.tagline,
    about = excluded.about,
    focus_areas = excluded.focus_areas,
    services = excluded.services,
    location = excluded.location,
    contact_email = excluded.contact_email,
    website_url = excluded.website_url,
    avatar_url = coalesce(organisation_pages.avatar_url, excluded.avatar_url),
    is_official = true,
    status = 'active',
    updated_at = now();

  insert into public.organisation_page_admins (page_id, user_id, role)
  values
    (info_page, founder, 'owner'),
    (workshops_page, founder, 'owner')
  on conflict (page_id, user_id) do update set role = 'owner';

  -- Preserve the duplicate account's content under the canonical Info page.
  update public.community_posts
  set author_id = info_page, is_official = true, updated_at = now()
  where author_id = duplicate_info;

  update public.community_comments
  set author_id = info_page, updated_at = now()
  where author_id = duplicate_info;

  insert into public.community_reactions (post_id, user_id, created_at)
  select post_id, info_page, created_at
  from public.community_reactions
  where user_id = duplicate_info
  on conflict (post_id, user_id) do nothing;
  delete from public.community_reactions where user_id = duplicate_info;

  insert into public.community_follows (follower_id, followee_id, created_at)
  select follower_id, info_page, created_at
  from public.community_follows
  where followee_id = duplicate_info
    and follower_id not in (info_page, duplicate_info)
  on conflict (follower_id, followee_id) do nothing;

  insert into public.community_follows (follower_id, followee_id, created_at)
  select info_page, followee_id, created_at
  from public.community_follows
  where follower_id = duplicate_info
    and followee_id not in (info_page, duplicate_info)
  on conflict (follower_id, followee_id) do nothing;
  delete from public.community_follows
  where follower_id = duplicate_info or followee_id = duplicate_info;

  insert into public.community_blocks (blocker_id, blocked_id, created_at)
  select blocker_id, info_page, created_at
  from public.community_blocks
  where blocked_id = duplicate_info
    and blocker_id not in (info_page, duplicate_info)
  on conflict (blocker_id, blocked_id) do nothing;

  insert into public.community_blocks (blocker_id, blocked_id, created_at)
  select info_page, blocked_id, created_at
  from public.community_blocks
  where blocker_id = duplicate_info
    and blocked_id not in (info_page, duplicate_info)
  on conflict (blocker_id, blocked_id) do nothing;
  delete from public.community_blocks
  where blocker_id = duplicate_info or blocked_id = duplicate_info;

  -- Organisation pages never participate in person-to-person connections.
  update public.community_connections
  set status = 'removed', accepted_at = null, updated_at = now()
  where status in ('pending', 'accepted')
    and (
      requester_id in (info_page, duplicate_info, workshops_page)
      or recipient_id in (info_page, duplicate_info, workshops_page)
    );

  update public.community_posts
  set is_official = true
  where author_id in (info_page, workshops_page);

  update public.community_profiles
  set display_name = 'Phapano - The Difference',
      connection_permission = 'nobody',
      visibility = 'visible',
      updated_at = now()
  where user_id = info_page;

  update public.community_profiles
  set display_name = 'Phapano Workshops',
      connection_permission = 'nobody',
      visibility = 'visible',
      updated_at = now()
  where user_id = workshops_page;

  update public.community_profiles
  set visibility = 'hidden',
      connection_permission = 'nobody',
      updated_at = now()
  where user_id = duplicate_info;

  -- Retain the legacy auth rows as stable content/FK anchors, but disable
  -- direct login. Page administration is owned by the founder UUID above.
  update auth.users
  set banned_until = 'infinity'::timestamptz,
      updated_at = now()
  where id in (info_page, duplicate_info, workshops_page);
end
$$;
