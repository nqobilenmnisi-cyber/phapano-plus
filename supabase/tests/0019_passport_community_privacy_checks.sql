-- Run after migration 0019.
-- The first query returns 22 rows; the second returns exactly two rows.

select table_name || '.' || column_name as verified_item
from information_schema.columns
where table_schema = 'public'
  and (
    (
      table_name = 'profiles'
      and column_name in (
        'share_bio',
        'share_career_stage',
        'share_university',
        'share_province',
        'share_psychology_interests',
        'share_skills',
        'share_volunteering',
        'share_workshops',
        'share_linkedin',
        'share_website',
        'share_scholar',
        'share_researchgate',
        'share_orcid'
      )
    )
    or (
      table_name = 'community_profiles'
      and column_name in (
        'province',
        'skills',
        'volunteering',
        'workshops',
        'linkedin_url',
        'website_url',
        'scholar_url',
        'researchgate_url',
        'orcid'
      )
    )
  )
order by verified_item;

select distinct event_object_table || '.' || trigger_name as verified_trigger
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in (
    'community_profiles_project_passport',
    'profiles_sync_community_projection'
  )
order by verified_trigger;
