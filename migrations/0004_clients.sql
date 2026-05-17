CREATE TABLE IF NOT EXISTS clients (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  display_name TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  is_active    INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

ALTER TABLE projects ADD COLUMN client_id INTEGER REFERENCES clients(id);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  clerk_user_id TEXT UNIQUE,
  email         TEXT,
  role          TEXT NOT NULL DEFAULT 'client',
  client_id     INTEGER REFERENCES clients(id),
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO clients (id, name, display_name, slug) VALUES (1, 'Hinckley Yacht', 'Hinckley', 'hinckley');
UPDATE projects SET client_id = 1 WHERE id = 1;
