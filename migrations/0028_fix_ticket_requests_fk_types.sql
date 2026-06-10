-- Migration 0028: fix ticket_requests foreign-key column types.
--
-- 0018 declared project_id/workflow_id as TEXT, but they reference INTEGER
-- primary keys (projects.id, workflows.id). SQLite stored whatever was bound and
-- relied on loose coercion in JOINs — fragile and index-unfriendly. Rebuild the
-- table with the correct INTEGER types, casting existing rows. (id, submitted_by_id,
-- reviewed_by remain TEXT — they reference the better-auth user.id / nanoid keys.)

CREATE TABLE ticket_requests_new (
  id                 TEXT PRIMARY KEY,
  project_id         INTEGER NOT NULL REFERENCES projects(id),
  submitted_by_id    TEXT REFERENCES "user"(id),
  submitted_by_name  TEXT,
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  category           TEXT NOT NULL DEFAULT 'Other',
  priority           TEXT NOT NULL DEFAULT 'Normal',
  workflow_id        INTEGER REFERENCES workflows(id),
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

INSERT INTO ticket_requests_new (
  id, project_id, submitted_by_id, submitted_by_name, title, description,
  category, priority, workflow_id, requested_due_date, status, reviewer_notes,
  rejection_reason, reviewed_by, reviewed_at, task_id, created_at, updated_at
)
SELECT
  id, CAST(project_id AS INTEGER), submitted_by_id, submitted_by_name, title, description,
  category, priority, CAST(workflow_id AS INTEGER), requested_due_date, status, reviewer_notes,
  rejection_reason, reviewed_by, reviewed_at, task_id, created_at, updated_at
FROM ticket_requests;

DROP TABLE ticket_requests;
ALTER TABLE ticket_requests_new RENAME TO ticket_requests;

CREATE INDEX IF NOT EXISTS idx_ticket_requests_project ON ticket_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_ticket_requests_status ON ticket_requests(status);
