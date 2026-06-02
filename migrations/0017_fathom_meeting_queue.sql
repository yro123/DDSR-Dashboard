-- Fathom meetings that couldn't be auto-matched to a client/project.
-- Stored here pending manual review and project assignment in the Review page.
CREATE TABLE fathom_meeting_queue (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  source_email_id     TEXT NOT NULL,
  title               TEXT NOT NULL,
  meeting_date        TEXT NOT NULL,
  duration_mins       INTEGER,
  summary             TEXT,
  raw_notes           TEXT,
  attendee_emails     TEXT,       -- JSON array of email strings
  topics_json         TEXT,       -- JSON MeetingTopic[] for meeting page structure
  tasks_json          TEXT,       -- JSON ExtractedTask[] created when approved
  decisions_json      TEXT,       -- JSON decisions[]
  status              TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  assigned_project_id INTEGER REFERENCES projects(id),
  reviewed_at         TEXT,
  created_at          TEXT NOT NULL
);
