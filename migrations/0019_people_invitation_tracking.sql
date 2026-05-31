-- 0019_people_invitation_tracking.sql
-- Add fields to better track the lifecycle of people as they become real users.

ALTER TABLE people ADD COLUMN invited_at TEXT;
ALTER TABLE people ADD COLUMN invited_by TEXT REFERENCES "user"(id) ON DELETE SET NULL;

-- Optional index for common queries
CREATE INDEX IF NOT EXISTS idx_people_invited_at ON people(invited_at);
