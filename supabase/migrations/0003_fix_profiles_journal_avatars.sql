-- =====================================================================
-- Migration 0003 — Make authenticated profile + journal data work reliably.
--
-- SAFE & NON-DESTRUCTIVE. This script only CREATES and ADDS. It never drops
-- tables, columns, or data, and it does not recreate the schema. It is safe
-- to run more than once.
--
-- It does NOT depend on any custom enum types (your database does not have the
-- career_stage enum, which is why the earlier enum-only migration failed). All
-- new columns are plain text / safe types.
--
-- Run this whole file in the Supabase SQL Editor.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PROFILES — ensure the table and every column the app uses exist.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists surname text;
alter table public.profiles add column if not exists role text default 'student';
alter table public.profiles add column if not exists career_stage text;
alter table public.profiles add column if not exists career_stage_other text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists province text;
alter table public.profiles add column if not exists interests text[] default '{}';
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists research_interests text;
alter table public.profiles add column if not exists application_year text;
alter table public.profiles add column if not exists goals text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists onboarding_complete boolean not null default false;
alter table public.profiles add column if not exists founding_member boolean not null default false;
alter table public.profiles add column if not exists notification_prefs jsonb not null default
  '{"deadlines":true,"funding":true,"community":true,"product":true}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- RLS: a user can read and write only their own profile row.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------
-- JOURNAL ENTRIES — ensure the table exists with text columns (no enums),
-- and is private to its owner. This is what fixes reflections disappearing.
-- ---------------------------------------------------------------------
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  prompt text,
  approach text,
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.journal_entries add column if not exists prompt text;
alter table public.journal_entries add column if not exists approach text;
alter table public.journal_entries add column if not exists mood text;
alter table public.journal_entries add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_journal_user on public.journal_entries(user_id);

alter table public.journal_entries enable row level security;
drop policy if exists "journal_own" on public.journal_entries;
create policy "journal_own" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- AUTO-CREATE a profile row whenever a new auth user signs up.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- BACKFILL: create a profile row for any existing user who doesn't have one
-- (including you, right now).
-- ---------------------------------------------------------------------
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- AVATARS storage bucket (public) + policies so users can upload their own.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_public_read" on storage.objects;
create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "avatar_insert_own" on storage.objects;
create policy "avatar_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatar_update_own" on storage.objects;
create policy "avatar_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Done. Your profile + journal data will now persist for the signed-in user.
