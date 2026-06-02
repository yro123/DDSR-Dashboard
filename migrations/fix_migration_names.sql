-- Run this against the production D1 database ONCE after deploying the renamed files.
-- D1 tracks applied migrations by filename in the d1_migrations table.
-- Without this update, wrangler will attempt to re-apply the renamed migrations.
--
-- Run with:
--   wrangler d1 execute ddsr-dashboard --remote --file=migrations/fix_migration_names.sql
--
-- Then delete this file from the repo.

UPDATE d1_migrations SET name = '0017_fathom_meeting_queue.sql'     WHERE name = '0016_fathom_meeting_queue.sql';
UPDATE d1_migrations SET name = '0018_ticket_requests.sql'          WHERE name = '0016_ticket_requests.sql';
UPDATE d1_migrations SET name = '0019_user_clients.sql'             WHERE name = '0017_user_clients.sql';
UPDATE d1_migrations SET name = '0020_backfill_user_clients.sql'    WHERE name = '0017_backfill_user_clients.sql';
UPDATE d1_migrations SET name = '0021_invitations_client_id.sql'    WHERE name = '0018_invitations_client_id.sql';
UPDATE d1_migrations SET name = '0022_people_invitation_tracking.sql' WHERE name = '0019_people_invitation_tracking.sql';
