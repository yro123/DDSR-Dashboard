-- Migration 0031: retag stranded manually-extracted tasks.
--
-- The Review → Manual tab extracts tasks via /api/admin/analyze-text, which used
-- to stamp them source_type = 'manual'. The review queue excludes 'manual'
-- (to keep hand-created form tasks out), so these extracted tasks were invisible
-- in both the review queue and — when unassigned — the per-person board.
--
-- Extraction now uses source_type = 'manual_text'. This backfills the rows
-- created before that change. We retag ONLY extraction-created rows (identified
-- by the task_event marker writeTask always inserts), so hand-created form tasks
-- keep source_type = 'manual' and stay out of the review queue.

UPDATE tasks
SET source_type = 'manual_text'
WHERE source_type = 'manual'
  AND id IN (
    SELECT task_id FROM task_events
    WHERE notes = 'Manually analyzed via Review page'
  );
