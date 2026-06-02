-- 0018_invitations_client_id.sql
-- Structural improvement: Make invitations reference clients by ID (not just slug).
-- This aligns invitations with the new user_clients membership model.

ALTER TABLE invitations ADD COLUMN client_id INTEGER REFERENCES clients(id);

-- Backfill existing invitations (if any) using the slug
UPDATE invitations 
SET client_id = (
  SELECT id FROM clients WHERE slug = invitations.clientSlug LIMIT 1
)
WHERE client_id IS NULL AND clientSlug IS NOT NULL;
