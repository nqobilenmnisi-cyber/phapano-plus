drop index if exists public.idx_saved_programmes_user_bookmarks;

alter table public.saved_programmes
  drop column if exists is_saved;
