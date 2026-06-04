-- Store to/cc recipient emails for domain matching on inbound emails
ALTER TABLE email_snapshots ADD COLUMN recipients_json TEXT;
