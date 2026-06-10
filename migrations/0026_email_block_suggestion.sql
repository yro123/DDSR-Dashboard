-- Migration 0026: Block-sender suggestion
-- Claude flags marketing / receipts / senders unrelated to any client so the
-- reviewer can one-click block them (adds the sender to ignore_rules, after
-- which the worker skips them before evaluation).

ALTER TABLE email_snapshots ADD COLUMN suggest_block INTEGER DEFAULT 0;  -- 1 = Claude suggests blocking the sender
ALTER TABLE email_snapshots ADD COLUMN block_reason  TEXT;               -- short reason for the suggestion
