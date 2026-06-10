-- Migration 0029: indexes for hot query paths.
--
-- projects.slug / clients.slug already have UNIQUE indexes (used by every
-- slug->project auth resolution). These add the composite indexes that the
-- list/filter queries actually use.

-- Tasks list is almost always scoped by project + archived state.
CREATE INDEX IF NOT EXISTS idx_tasks_project_archived ON tasks(project_id, is_archived);
-- Meetings list scoped by project + published flag.
CREATE INDEX IF NOT EXISTS idx_meetings_project_published ON meetings(project_id, is_published);
-- People list scoped by project + active flag.
CREATE INDEX IF NOT EXISTS idx_people_project_active ON people(project_id, is_active);
-- Email-domain auto-mapping + people-link lookups query people by email.
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email);
-- Documents list scoped by project.
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
-- Tasks joined to email snapshots by source_email_id.
CREATE INDEX IF NOT EXISTS idx_tasks_source_email ON tasks(source_email_id);
