-- Migration 0025: Email assessment (urgency / criticality / resolution / solution)
-- Adds per-email ratings produced at evaluation time, plus open/resolved tracking
-- for the Review page "Needs Attention" view and the morning digest.

ALTER TABLE email_snapshots ADD COLUMN is_task           INTEGER DEFAULT 0;   -- 1 if a task was extracted from this email
ALTER TABLE email_snapshots ADD COLUMN urgency           TEXT;                -- High | Medium | Low
ALTER TABLE email_snapshots ADD COLUMN criticality       TEXT;                -- High | Medium | Low
ALTER TABLE email_snapshots ADD COLUMN resolution_bucket TEXT;                -- '<1h' | '1-4h' | '1d' | 'multi-day'
ALTER TABLE email_snapshots ADD COLUMN solution_outline  TEXT;                -- short possible-solution text
ALTER TABLE email_snapshots ADD COLUMN assessment_status TEXT;               -- needs_response | waiting_on_others | informational
ALTER TABLE email_snapshots ADD COLUMN assessed_at       TEXT;               -- ISO timestamp of last assessment
ALTER TABLE email_snapshots ADD COLUMN resolved_at       TEXT;               -- manual resolution; NULL = open

-- Speeds up the "needs attention" window query (last 3 days, unresolved).
CREATE INDEX IF NOT EXISTS idx_snapshots_attention ON email_snapshots (received_at, resolved_at);
