-- Migration 0005: Email task automation support
-- Extends existing tables and adds new tables for the email-task-worker integration.

-- ── Extend tasks ────────────────────────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN source_type TEXT DEFAULT 'manual';
ALTER TABLE tasks ADD COLUMN source_email_id TEXT;
ALTER TABLE tasks ADD COLUMN source_excerpt TEXT;
ALTER TABLE tasks ADD COLUMN source_highlight_start INTEGER;
ALTER TABLE tasks ADD COLUMN source_highlight_end INTEGER;
ALTER TABLE tasks ADD COLUMN confidence REAL;
ALTER TABLE tasks ADD COLUMN claude_reasoning TEXT;
ALTER TABLE tasks ADD COLUMN user_feedback TEXT;
ALTER TABLE tasks ADD COLUMN completed_by_id INTEGER REFERENCES people(id);
ALTER TABLE tasks ADD COLUMN completion_source_email TEXT;
ALTER TABLE tasks ADD COLUMN unmatched_assignee_name TEXT;
ALTER TABLE tasks ADD COLUMN unmatched_assignee_email TEXT;

-- ── Extend meetings ──────────────────────────────────────────────────────────
ALTER TABLE meetings ADD COLUMN source_type TEXT DEFAULT 'manual';
ALTER TABLE meetings ADD COLUMN source_email_id TEXT;
ALTER TABLE meetings ADD COLUMN duration_mins INTEGER;
ALTER TABLE meetings ADD COLUMN summary TEXT;
ALTER TABLE meetings ADD COLUMN raw_notes TEXT;

-- ── New tables ───────────────────────────────────────────────────────────────

-- Deduplication log: prevents reprocessing the same email across cron runs
CREATE TABLE emails_processed (
  message_id   TEXT PRIMARY KEY,
  processed_at TEXT,
  batch_date   TEXT,
  source_type  TEXT DEFAULT 'email'
);

-- Raw email snapshots: stored for the dashboard source view and full-email modal
CREATE TABLE email_snapshots (
  message_id    TEXT PRIMARY KEY,
  subject       TEXT,
  from_name     TEXT,
  from_email    TEXT,
  received_at   TEXT,
  body_preview  TEXT,
  body_full     TEXT,
  thread_id     TEXT,
  source_type   TEXT DEFAULT 'email'
);

-- Full audit trail of task state changes (creates, completions, feedback, dismissals)
CREATE TABLE task_events (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER REFERENCES tasks(id),
  event_type   TEXT,
  actor_id     INTEGER REFERENCES people(id),
  source_email TEXT,
  notes        TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- Decisions captured from Fathom / meeting notes emails
CREATE TABLE meeting_decisions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id  INTEGER REFERENCES meetings(id),
  decision    TEXT,
  project_id  INTEGER REFERENCES projects(id)
);

-- Sender/keyword ignore rules: emails matching these are skipped before Claude analysis
CREATE TABLE ignore_rules (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  type    TEXT,   -- 'sender' | 'keyword' | 'subject'
  value   TEXT,
  reason  TEXT
);
