-- =============================================================
-- 0011_ep_heller_seed.sql
-- EP Heller project seed: project, workflows, people, tasks, documents
-- Sources: EP_Heller_Project_ToDo (1).docx (55 tasks),
--          EP_Heller_Post_Go_Live xlsx (~11 done tasks),
--          Weekly_To_Do_Board xlsx (status/priority overlays),
--          SOPs/ folder (6 SOP documents via zip)
-- =============================================================

-- Project row already exists (created via Admin panel).
-- All inserts below reference it via slug='ep-heller'.

-- -------------------------------------------------------
-- WORKFLOWS (7)
-- -------------------------------------------------------
INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'netsuite-config', 'NetSuite Configuration & Item Management', 'NetSuite',
    'Item setup, configuration, automation, and reporting', '#1E40AF', '#DBEAFE', '⚙️', 1, 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'inventory', 'Inventory Management & Warehouse', 'Inventory',
    'Inventory conversion, valuation, and SOP development', '#166534', '#DCFCE7', '📦', 2, 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'wms', 'WMS & Bin Management', 'WMS',
    'Warehouse management system, bin setup, and scanning', '#9A3412', '#FFEDD5', '🏭', 3, 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'payroll-hr', 'Payroll, HR & Access Control', 'Payroll/HR',
    'Payroll processing, HR system integrations, and access control', '#6B21A8', '#F3E8FF', '👥', 4, 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'finance', 'Finance & Banking', 'Finance',
    'Financial reporting, bank reconciliation, and accounting', '#0F766E', '#CCFBF1', '💰', 5, 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'shipping', 'Shipping & Integrations', 'Shipping',
    'Shipping integrations, international workflow, and Shopify', '#0369A1', '#E0F2FE', '🚢', 6, 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO workflows (project_id, slug, name, short_name, description, color, bg_color, icon, sort_order, is_active)
  SELECT id, 'admin', 'Admin & Infrastructure', 'Admin',
    'System administration and infrastructure setup', '#374151', '#F3F4F6', '🔧', 7, 1
  FROM projects WHERE slug = 'ep-heller';

-- -------------------------------------------------------
-- PEOPLE (10)
-- -------------------------------------------------------
INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Adina', 'Consultant', 'ddsr', '#4F46E5', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Corey', 'Consultant', 'ddsr', '#0891B2', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'James', 'Warehouse Manager', 'client', '#16A34A', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Joel', 'Payroll Specialist', 'vendor', '#D97706', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Yehuda', 'IT / Operations', 'client', '#9333EA', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Sarah', 'Operations', 'client', '#EC4899', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Q', 'Operations', 'client', '#64748B', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Joanne', 'Operations', 'client', '#F59E0B', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Peter', 'Leadership', 'client', '#EF4444', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

INSERT INTO people (project_id, name, role, org_type, avatar_bg, avatar_fg, is_active)
  SELECT id, 'Edwin', 'Warehouse', 'client', '#14B8A6', '#FFFFFF', 1 FROM projects WHERE slug = 'ep-heller';

-- -------------------------------------------------------
-- TASKS — NETSUITE CONFIGURATION & ITEM MANAGEMENT (19)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Review List Item Details', 'In Progress', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create UoM Conversions', 'Stuck', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Enable Item Substitution in NetSuite', 'WAIT ON WMS BUNDLE', 'Stuck', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Sarah', 'Convert Purchasing to Resale', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Sarah' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Reclassify items on List 1 from "manufactured" to "resale"', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create new reports for the "resale" inventory segment', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Update items on open POs to the consolidated record as they are encountered', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Work with Joanne and Peter to populate missing data in the item report', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create the first item master data Safe Search for cleanup', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create a new cleanup report for Q to identify items missing required fields', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Item Lists — review and maintain', 'In Progress', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create automated backup reports', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Set up automated NetSuite data exports to her email', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Create an ERP user account for James', 'Not Started', 'Normal', 14, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Set up a recurring ACH payment for the NetSuite invoice', 'Not Started', 'Normal', 15, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Continue building the "Daily NetSuite Sales Orders" dashboard', 'Not Started', 'Normal', 16, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Add "Quote valid for 7 business days" text to the PDF template', 'Not Started', 'Normal', 17, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Finalize the exact quote verbiage with Peter', 'Not Started', 'Normal', 18, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create the "Station Status" custom list and field', 'Not Started', 'Normal', 19, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

-- -------------------------------------------------------
-- TASKS — INVENTORY MANAGEMENT & WAREHOUSE (10 + 1 done)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'James', 'Proceed with inventory conversion using the manual workflow', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='James' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'James', 'Mark any items not found in NetSuite for later processing', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='James' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'James', 'Begin valuing raw material inventory using the "negative out, positive in" method', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='James' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Consult Edwin on inventory status for packaging materials', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Engage Q to review the inventory cleanup spreadsheet after the two-week pause', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Meet for inventory scanning training with James and Edwin', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Provide James with the existing inventory SOPs', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Consolidate item creation SOPs into a single document for James', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create an SOP for the inventory valuation process', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Automate the inventory conversion workflow',
    'Default Use Bins to checked; auto-copy Purchase Description to Sales Description if blank; default COGS account to 544',
    'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Understand Current Inventory Counts / Excel Document', 'Done', 'Normal', 11, 0
  FROM projects p, workflows w
  WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id;

-- -------------------------------------------------------
-- TASKS — WMS & BIN MANAGEMENT (8)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Email vendor — WMS PrintNode Bundle install: confirm plan', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Bin Labels — create and assign', 'In Progress', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create NetSuite bin templates from the bin template spreadsheet', 'In Progress', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Update all bins: set Type to "Picking" and enable WMS', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Research a workflow to link bin scans directly to preferred items', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Investigate and resolve the "Please enter sequence number for bin" error', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Remove bin location types to fix the WMS mobile app error', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Contact IPSI for help setting up the label printer', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='wms' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

-- -------------------------------------------------------
-- TASKS — PAYROLL, HR & ACCESS CONTROL (13)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Joel', 'Import all employee data and YTD figures from ADP Run', 'Not Started', 'Critical', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Joel' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Joel', 'Build the CSV export feature in FingerCheck based on the template', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Joel' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Joel', 'Configure the export to pull the check number into the line description', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Joel' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Correct the FingerCheck ledger and test the import', 'In Progress', 'Critical', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Correct April payroll journal entries to enable bank reconciliation', 'Not Started', 'Critical', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Call ADP to cancel payroll', 'In Progress', 'Critical', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Request software access from Verkada for payroll integration', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'New hire in FingerCheck / Termination — remove access; enable access automatically in Verkada', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Add FingerCheck to Verkada access automation to the project list', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Verkada — configure phone as FOB', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'TCP integration — recognize sign-on times based on door access times', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Use portal access to reconcile 401k contributions', 'Not Started', 'Critical', 12, 0
  FROM projects p, workflows w
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Ask Human Interest for guidance on remitting withheld 401k funds', 'Not Started', 'Critical', 13, 0
  FROM projects p, workflows w
  WHERE p.slug='ep-heller' AND w.slug='payroll-hr' AND w.project_id=p.id;

-- -------------------------------------------------------
-- TASKS — FINANCE & BANKING (3 active + 10 post-go-live)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Investigate the cause of the bank reconciliation failure for accounts 103/104', 'Not Started', 'Critical', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Research the Bank of America "Cashflow Connect" option', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Provide Adina with executive reporting requirements after the next meeting', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Bank Recs', 'Done', 'Normal', 4, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Accounts Receivable', 'Done', 'Normal', 5, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Accounts Payable', 'Done', 'Normal', 6, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Balance Sheet Account', 'Done', 'Normal', 7, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Review Report Calculating Sales Tax', 'Done', 'Normal', 8, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Update Customer Relevant Info (Tax)', 'Done', 'Normal', 9, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Create Automated Report with all Info Needed for Tax', 'Done', 'Normal', 10, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Use Tax — Determine how to move forward', 'Done', 'Normal', 11, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Credit Card Recs', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'P&L Accounts / Classification', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

-- -------------------------------------------------------
-- TASKS — SHIPPING & INTEGRATIONS (3)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Investigate ShipCentral integration requirements, including international paperwork and customer-paid shipping', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='shipping' AND w.project_id=p.id AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Begin planning international shipping workflow', 'Stuck', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='shipping' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Connect with Solly to explore Shopify Amex integration options', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='shipping' AND w.project_id=p.id AND per.name='Adina' AND per.project_id=p.id;

-- -------------------------------------------------------
-- TASKS — ADMIN & INFRASTRUCTURE (1)
-- -------------------------------------------------------
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Corey', 'Create email account for backup email', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='ep-heller' AND w.slug='admin' AND w.project_id=p.id AND per.name='Corey' AND per.project_id=p.id;

-- -------------------------------------------------------
-- DOCUMENTS (9)
-- Base: https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller
-- -------------------------------------------------------

-- Project-level reference documents (no workflow)
INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT id, NULL, 'EP Heller Post Go-Live Tasks',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/Docs%20for%20Dashboard/EP_Heller_Post_Go_Live_1779152977.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT id, NULL, 'EP Heller Project To-Do',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/Docs%20for%20Dashboard/EP_Heller_Project_ToDo%20%281%29.docx?web=1',
    'docx', 1
  FROM projects WHERE slug = 'ep-heller';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT id, NULL, 'EP Heller Weekly To-Do Board',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/Docs%20for%20Dashboard/Weekly_To_Do_Board_EP_Heller_1779153011.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug = 'ep-heller';

-- SOP documents linked to workflows
INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Converting an Item To Inventory',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/SOPs/Converting%20an%20Item%20To%20Inventory.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Credit Memos from Invoices',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/SOPs/Credit%20Memos%20from%20Invoices.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Opening Balance Inventory Adjustment',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/SOPs/Opening%20Balance%20Inventory%20Adjustment.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'SOP for Item Creations',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/SOPs/SOP%20for%20Item%20Creations%2004.30.2026.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='inventory' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Standalone Credit Memos',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/SOPs/Standalone%20Credit%20Memos.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='finance' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Update Stations',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/2%20-%20EP%20Heller/SOPs/Update%20Stations%20%28V05.17.26%29.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='ep-heller' AND w.slug='netsuite-config' AND w.project_id=p.id;
