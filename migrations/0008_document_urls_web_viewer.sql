-- Force SharePoint document links to open in Word Online (browser viewer)
-- ?web=1 tells SharePoint to serve the file via Word for the Web instead of downloading it
UPDATE documents
SET url = url || '?web=1'
WHERE url LIKE '%sharepoint.com%'
  AND url IS NOT NULL;
