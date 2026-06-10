-- Migration 0027: backfill the explicit isAdmin flag for internal staff.
--
-- The "@datadrivensr.com email => admin" rule was removed from runtime authz
-- (self-service signup made it a privilege-escalation vector). To avoid locking
-- out existing internal users, grant them the explicit flag once here. New
-- admins are granted via the Users admin tab (which sets isAdmin) going forward.
UPDATE "user" SET "isAdmin" = 1 WHERE LOWER("email") LIKE '%@datadrivensr.com';
