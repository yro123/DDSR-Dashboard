-- Link people (team member records) to user (auth accounts)
-- user_id is nullable: not every team member needs an auth account
ALTER TABLE people ADD COLUMN user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_people_user_id ON people(user_id);
