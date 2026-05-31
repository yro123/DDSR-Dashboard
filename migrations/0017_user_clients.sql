-- 0017_user_clients.sql
-- Structural improvement: Proper many-to-many relationship between users and clients.
--
-- Context:
-- - We are growing the number of clients.
-- - Each client will have multiple users.
-- - Internal team (@datadrivensr.com) should have access to all clients.
--
-- This table allows:
--   - One client → many users (current need)
--   - One user → many clients (future flexibility)
--   - Cleaner authorization logic
--
-- During transition we keep the `clientSlug` column on the `user` table for backward compatibility.

CREATE TABLE IF NOT EXISTS user_clients (
  user_id     TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member',   -- 'member', 'admin', etc. (for future use)
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, client_id)
);

-- Helpful index for common queries
CREATE INDEX IF NOT EXISTS idx_user_clients_client ON user_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_user_clients_user ON user_clients(user_id);

-- Optional: Seed example (uncomment and adjust if you want to backfill existing users)
-- INSERT OR IGNORE INTO user_clients (user_id, client_id, role)
-- SELECT u.id, c.id, 'member'
-- FROM "user" u
-- JOIN clients c ON c.slug = u.clientSlug
-- WHERE u.clientSlug IS NOT NULL;
