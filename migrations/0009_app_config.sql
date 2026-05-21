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

-- ── Global defaults ────────────────────────────────────────────────────
INSERT OR IGNORE INTO app_config (project_id, category, value, color, sort_order, is_system) VALUES
  -- Task statuses
  (NULL, 'task_status', 'Not Started', '#94A3B8', 0, 0),
  (NULL, 'task_status', 'In Progress', '#3B82F6', 1, 0),
  (NULL, 'task_status', 'Done',        '#16A34A', 2, 1),
  -- Task priorities
  (NULL, 'task_priority', 'High',   '#DC2626', 0, 0),
  (NULL, 'task_priority', 'Medium', '#D97706', 1, 0),
  (NULL, 'task_priority', 'Low',    '#16A34A', 2, 0),
  -- Org types
  (NULL, 'org_type', 'Client',   NULL, 0, 0),
  (NULL, 'org_type', 'Partner',  NULL, 1, 0),
  (NULL, 'org_type', 'Vendor',   NULL, 2, 0),
  (NULL, 'org_type', 'Internal', NULL, 3, 0),
  -- Document types
  (NULL, 'doc_type', 'Process Doc', NULL, 0, 0),
  (NULL, 'doc_type', 'Training',    NULL, 1, 0),
  (NULL, 'doc_type', 'SOP',         NULL, 2, 0),
  (NULL, 'doc_type', 'Reference',   NULL, 3, 0),
  (NULL, 'doc_type', 'Template',    NULL, 4, 0),
  (NULL, 'doc_type', 'Other',       NULL, 5, 0),
  -- Action item statuses
  (NULL, 'action_status', 'Open',        '#3B82F6', 0, 1),
  (NULL, 'action_status', 'In Progress', '#D97706', 1, 0),
  (NULL, 'action_status', 'Closed',      '#16A34A', 2, 0),
  (NULL, 'action_status', 'On Hold',     '#94A3B8', 3, 0),
  -- Meeting topic color palette
  (NULL, 'topic_color', '#3B82F6', NULL, 0, 0),
  (NULL, 'topic_color', '#22C55E', NULL, 1, 0),
  (NULL, 'topic_color', '#F59E0B', NULL, 2, 0),
  (NULL, 'topic_color', '#A855F7', NULL, 3, 0),
  (NULL, 'topic_color', '#14B8A6', NULL, 4, 0),
  (NULL, 'topic_color', '#EF4444', NULL, 5, 0),
  (NULL, 'topic_color', '#6366F1', NULL, 6, 0),
  (NULL, 'topic_color', '#64748B', NULL, 7, 0);
