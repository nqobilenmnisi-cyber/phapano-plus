-- Restore the notification function by reapplying migration 0027 after this
-- rollback. Existing notifications are intentionally not recreated.
\ir ../migrations/0027_pathway_notifications.sql
