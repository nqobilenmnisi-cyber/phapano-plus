-- Rollback for migration 0025.
-- Warning: mention relationships and their notification history are removed.

drop trigger if exists community_mentions_notify on public.community_mentions;
drop trigger if exists community_reactions_notify on public.community_reactions;
drop trigger if exists community_comments_notify on public.community_comments;
drop trigger if exists community_passes_notify on public.community_posts;
drop function if exists public.community_notify_interaction();
drop function if exists public.community_actor_name(uuid);
drop table if exists public.community_mentions;

drop index if exists public.notifications_unread_dedupe_idx;
alter table public.notifications drop column if exists dedupe_key;

alter table public.community_reactions
  drop constraint if exists community_reactions_type_check;
update public.community_reactions
set reaction_type = 'helpful'
where reaction_type = 'insightful';
alter table public.community_reactions
  add constraint community_reactions_type_check check (
    reaction_type in ('support', 'helpful', 'celebrate')
  );

alter table public.profiles
  drop constraint if exists profiles_professional_category_check;
alter table public.community_profiles
  drop constraint if exists community_profiles_professional_category_check;

update public.profiles
set professional_category = 'psychologist'
where professional_category in (
  'clinical_psychologist',
  'counselling_psychologist',
  'educational_psychologist',
  'industrial_psychologist',
  'neuropsychologist',
  'research_psychologist'
);
update public.community_profiles
set professional_category = 'psychologist'
where professional_category in (
  'clinical_psychologist',
  'counselling_psychologist',
  'educational_psychologist',
  'industrial_psychologist',
  'neuropsychologist',
  'research_psychologist'
);

alter table public.profiles
  add constraint profiles_professional_category_check check (
    professional_category is null
    or professional_category in (
      'psychologist', 'registered_counsellor', 'psychometrist', 'other'
    )
  );

alter table public.community_profiles
  add constraint community_profiles_professional_category_check check (
    professional_category is null
    or professional_category in (
      'psychologist', 'registered_counsellor', 'psychometrist', 'other'
    )
  );
