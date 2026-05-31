-- 0017_backfill_user_clients.sql
-- One-time backfill script for existing data.
--
-- Run this AFTER applying 0017_user_clients.sql if you already have users
-- with clientSlug assigned who should have access to those clients.
--
-- This will not overwrite existing rows in user_clients.

INSERT OR IGNORE INTO user_clients (user_id, client_id, role, created_at, updated_at)
SELECT 
  u.id,
  c.id,
  'member',
  datetime('now'),
  datetime('now')
FROM "user" u
JOIN clients c ON c.slug = u.clientSlug
WHERE u.clientSlug IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM user_clients uc 
    WHERE uc.user_id = u.id AND uc.client_id = c.id
  );
