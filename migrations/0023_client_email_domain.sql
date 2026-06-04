-- Add email domain to clients for automatic project identification from email addresses
ALTER TABLE clients ADD COLUMN email_domain TEXT;
