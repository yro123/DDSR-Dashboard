-- Remove redundant assignee_name column from tasks.
-- The name is now derived at query time via:
--   COALESCE(user.name, people.name) AS assignee_name
-- Unlinked people fall back to people.name; linked people use their auth profile name.
ALTER TABLE tasks DROP COLUMN assignee_name;
