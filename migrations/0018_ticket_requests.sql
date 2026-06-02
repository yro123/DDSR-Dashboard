CREATE TABLE IF NOT EXISTS ticket_requests (
  id                 TEXT PRIMARY KEY,
  project_id         TEXT NOT NULL REFERENCES projects(id),
  submitted_by_id    TEXT REFERENCES user(id),
  submitted_by_name  TEXT,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  category           TEXT NOT NULL DEFAULT 'Other',
  priority           TEXT NOT NULL DEFAULT 'Normal',
  workflow_id        TEXT REFERENCES workflows(id),
  requested_due_date TEXT,
  status             TEXT NOT NULL DEFAULT 'Pending',
  reviewer_notes     TEXT,
  rejection_reason   TEXT,
  reviewed_by        TEXT,
  reviewed_at        INTEGER,
  task_id            INTEGER REFERENCES tasks(id),
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);

-- Ensure app_config exists (created in 0009, but included here for local dev safety)
CREATE TABLE IF NOT EXISTS app_config (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  value       TEXT NOT NULL,
  label       TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  is_system   INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_config_scope
  ON app_config(COALESCE(project_id, -1), category, value);

INSERT OR IGNORE INTO app_config
  (project_id, category, value, label, color, sort_order, is_active, is_system)
VALUES
  (NULL, 'ticket_category', 'Feature Request', 'Feature Request', '#6366F1', 1, 1, 1),
  (NULL, 'ticket_category', 'Bug / Issue',     'Bug / Issue',     '#EF4444', 2, 1, 1),
  (NULL, 'ticket_category', 'Data / Report',   'Data / Report',   '#F59E0B', 3, 1, 1),
  (NULL, 'ticket_category', 'Access Request',  'Access Request',  '#10B981', 4, 1, 1),
  (NULL, 'ticket_category', 'Training',        'Training',        '#3B82F6', 5, 1, 1),
  (NULL, 'ticket_category', 'Other',           'Other',           '#94A3B8', 6, 1, 1),
  (NULL, 'ticket_priority', 'Urgent',  'Urgent',  '#EF4444', 1, 1, 1),
  (NULL, 'ticket_priority', 'High',    'High',    '#F59E0B', 2, 1, 1),
  (NULL, 'ticket_priority', 'Normal',  'Normal',  '#6366F1', 3, 1, 1),
  (NULL, 'ticket_priority', 'Low',     'Low',     '#94A3B8', 4, 1, 1),
  (NULL, 'ticket_status',   'Pending',   'Pending',   '#F59E0B', 1, 1, 1),
  (NULL, 'ticket_status',   'In Review', 'In Review', '#6366F1', 2, 1, 1),
  (NULL, 'ticket_status',   'Approved',  'Approved',  '#10B981', 3, 1, 1),
  (NULL, 'ticket_status',   'Rejected',  'Rejected',  '#EF4444', 4, 1, 1),
  (NULL, 'ticket_status',   'Deferred',  'Deferred',  '#94A3B8', 5, 1, 1);
