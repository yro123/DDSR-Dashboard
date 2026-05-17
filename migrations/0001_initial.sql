-- ── PROJECTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  name                TEXT NOT NULL,
  client_display_name TEXT NOT NULL,
  subtitle            TEXT,
  slug                TEXT NOT NULL UNIQUE,
  go_live_date        TEXT,
  project_start_date  TEXT,
  project_end_date    TEXT,
  is_active           INTEGER NOT NULL DEFAULT 1,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── PEOPLE ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  role        TEXT,
  org_type    TEXT,
  avatar_bg   TEXT,
  avatar_fg   TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── WORKFLOWS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  short_name  TEXT NOT NULL,
  description TEXT,
  color       TEXT,
  bg_color    TEXT,
  phase       TEXT,
  icon        TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── WORKFLOW OWNERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_owners (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  person_id   INTEGER REFERENCES people(id) ON DELETE SET NULL,
  owner_name  TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ── WORKFLOW STEPS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_steps (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Not Started',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── WORKFLOW STEP DETAILS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_step_details (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_step_id INTEGER NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  summary          TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── WORKFLOW STEP DETAIL POINTS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflow_step_detail_points (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  step_detail_id INTEGER NOT NULL REFERENCES workflow_step_details(id) ON DELETE CASCADE,
  point_text     TEXT NOT NULL,
  sort_order     INTEGER NOT NULL DEFAULT 0
);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  url         TEXT,
  doc_type    TEXT,
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── TASKS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id             INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id            INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
  assignee_id            INTEGER REFERENCES people(id) ON DELETE SET NULL,
  assignee_name          TEXT,
  title                  TEXT NOT NULL,
  notes                  TEXT,
  status                 TEXT NOT NULL DEFAULT 'Not Started',
  priority               TEXT,
  due_date               TEXT,
  is_archived            INTEGER NOT NULL DEFAULT 0,
  archived_at            TEXT,
  source_meeting_id      INTEGER REFERENCES meetings(id) ON DELETE SET NULL,
  source_action_item_id  INTEGER REFERENCES meeting_action_items(id) ON DELETE SET NULL,
  sort_order             INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── MEETINGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL,
  meeting_date  TEXT NOT NULL,
  display_date  TEXT,
  title         TEXT NOT NULL,
  meeting_type  TEXT,
  location      TEXT,
  next_meeting  TEXT,
  is_published  INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── MEETING ATTENDEES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_attendees (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id   INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  person_id    INTEGER REFERENCES people(id) ON DELETE SET NULL,
  attendee_name TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

-- ── MEETING TOPICS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_topics (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id  INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  workflow_id INTEGER REFERENCES workflows(id) ON DELETE SET NULL,
  area        TEXT NOT NULL,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── MEETING NOTES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES meeting_topics(id) ON DELETE CASCADE,
  note_text  TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── MEETING ACTION ITEMS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meeting_action_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id      INTEGER NOT NULL REFERENCES meeting_topics(id) ON DELETE CASCADE,
  action_text   TEXT NOT NULL,
  assignee_name TEXT,
  assignee_id   INTEGER REFERENCES people(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'Open',
  task_id       INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── INDEXES ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow   ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee   ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_archived   ON tasks(is_archived);
CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_project  ON meetings(project_id);
CREATE INDEX IF NOT EXISTS idx_meeting_topics_meeting ON meeting_topics(meeting_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
