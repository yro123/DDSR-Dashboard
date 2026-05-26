-- Oil Depot seed migration
-- Project row already exists (created via Admin panel).
-- All inserts below reference it via slug='oil-depot'.

-- ============================================================
-- WORKFLOWS
-- ============================================================
INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'it-infrastructure', 'IT & Infrastructure', 'IT', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'netsuite-config', 'NetSuite Configuration & Development', 'NetSuite', 2
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'shopify', 'Shopify Integration & E-Commerce', 'Shopify', 3
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'pricing-inventory', 'Pricing & Inventory', 'Pricing', 4
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'finance-ar', 'Finance, AR & Collections', 'Finance/AR', 5
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'banking', 'Banking & Accounts', 'Banking', 6
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'sales', 'Sales & Customer Management', 'Sales', 7
  FROM projects WHERE slug='oil-depot';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'website', 'Website & Marketing', 'Website', 8
  FROM projects WHERE slug='oil-depot';

-- ============================================================
-- PEOPLE
-- ============================================================
INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Adina', 'Consultant', 'ddsr' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Yehuda', 'Consultant', 'ddsr' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Peter', 'Leadership', 'client' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Francis', 'Web Designer', 'vendor' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Sarah', 'Operations', 'client' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Chaya', 'Finance / AR', 'client' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Luke', 'Sales', 'client' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Global Tech', 'IT Vendor', 'vendor' FROM projects WHERE slug='oil-depot';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'NetSuite Consultants', 'NS Vendor', 'vendor' FROM projects WHERE slug='oil-depot';

-- ============================================================
-- TASKS: IT & Infrastructure
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Global Tech', 'Install VPN NetBird on each PC', 'In Progress', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Global Tech' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Global Tech', 'Determine cost to keep the server running to host the QB file', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Global Tech' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Global Tech', 'Put the QB Backup File/Folder on OneDrive/SharePoint for safety', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Global Tech' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Update everyone to Redwood', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Create Groups in the system', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Create Group Calendars', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Upload documents specific to each group on SharePoint', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Show everyone how to access SharePoint', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Integration request for customers to auto-appear on screen based on phone screening', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Set up backup email', 'Done', 'Normal', 10, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Warehouse staging customization', 'Done', 'Normal', 11, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Cloud printing setup', 'Done', 'Normal', 12, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Fix printers', 'Done', 'Normal', 13, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Item labels setup', 'Done', 'Normal', 14, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='it-infrastructure' AND w.project_id=p.id;

-- ============================================================
-- TASKS: NetSuite Configuration & Development
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'NetSuite Consultants', 'WMS Page Element for Tally Scan', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='NetSuite Consultants' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'NetSuite Consultants', 'Create saved search for stale fulfillments and schedule daily email alerts', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='NetSuite Consultants' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'NetSuite Consultants', 'Email the inventory availability strategy to Adina', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='NetSuite Consultants' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'NetSuite Consultants', 'Help setting up the Dunning Modules', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='NetSuite Consultants' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'NetSuite Consultants', 'Conversion Rate on Average Cost (to Sales Units)', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='NetSuite Consultants' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'NetSuite Consultants', 'Available Field Transfers Exclude', 'In Progress', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='NetSuite Consultants' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Involve Ben and Miguel to define the warehouse fulfillment process within NetSuite', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create a Capacity Available Report in NetSuite', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Add logic to default Open Time, Close Time, and Customer Route from the customer record', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Create saved searches', 'Done', 'Normal', 10, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Consolidate invoice forms', 'Done', 'Normal', 11, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Consolidate sales order forms', 'Done', 'Normal', 12, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id;

-- ============================================================
-- TASKS: Shopify Integration & E-Commerce
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Work with NetSuite on push from NetSuite back to Shopify once order is fulfilled', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Update the integration to set Price Level to "Custom" for Shopify', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Resolve issue with creating customer accounts on Shopify', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Schedule follow-up call to review updates and plan Phase 2', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Define Shopify fulfillment cutoff; coordinate with Ben & Miguel to route Shopify orders to Amazon FBM', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Design label/tracking flow (NetSuite Ship Central vs Shopify); implement Shopify fulfillment pushback with tracking', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Configure Shopify shipping: enable rates, set $99 free-shipping threshold, exclude AK/HI/PR/Canada', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Determine if shipping labels will be generated from within NetSuite', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Decide whether shipping items and fields should be enabled in NetSuite; update Sales Order mapping accordingly', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Decide on discount code strategy (e.g. TAKE10 for 10% off); create Discount items in NetSuite and map to orders', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Fix/decide on numbering convention for Shopify Sales Orders (separate from standard SOs)', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Review inventory availability strategy with Miguel', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Confirm strategy for shipping/discount mapping with Peter', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Fix the Auto Shopify Email Template', 'Not Started', 'Normal', 14, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Shopify-to-NetSuite connection live', 'Done', 'Normal', 15, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id;

-- ============================================================
-- TASKS: Pricing & Inventory
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Develop a detailed pricing plan, including shipping cost calculations and process for Luke to implement', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Discuss with team: Vendor Price Increases Process', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Mark all custom prices to be removed on the shared "Pricing Update" sheet', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Fix UOM errors and consolidate group pricing in NetSuite', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Finalize base price updates in the master sheet', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Remove marked custom prices from NetSuite', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Execute Phase 2 custom pricing update', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Import the corrected "Luke''s pricing" sheet', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Run the main pricing overhaul (conversions and removals) after receiving Luke''s export', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Schedule a recurring weekly email of the custom pricing report to prevent future data conflicts', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Non-moving items review', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Clearer view on items in inventory', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Search for Sales by Pallets', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Confirm arrival dates in MRP', 'Done', 'Normal', 14, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Fill boxes in MRP', 'Done', 'Normal', 15, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id;

-- ============================================================
-- TASKS: Finance, AR & Collections
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', '3% Surcharge Choice by Customer — determine implementation', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Report for invoices that are short-paid', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Hold orders for aging over terms', 'Not Started', 'Critical', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Dunning Templates — review active templates', 'Not Started', 'Critical', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Start sending Dunning Letters', 'Not Started', 'Critical', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Sarah', 'AR Statement Excel Search', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Sarah' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Increasing AR Customer Report', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Bad Debt — Deduction from Commission?', 'In Progress', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Creating new Terms', 'In Progress', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Monitor Bank of America feed; report persistent MFA issues to Adina to trigger Cashflow Connect evaluation', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Test sales tax bundle', 'Done', 'Normal', 11, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Import tax certificates', 'Done', 'Normal', 12, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Write sales tax documentation', 'Done', 'Normal', 13, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Set sales tax engine live in production', 'Done', 'Normal', 14, 0
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='finance-ar' AND w.project_id=p.id;

-- ============================================================
-- TASKS: Banking & Accounts
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Chaya', 'Send the "cheat sheet" email on correct card usage to Adina', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Chaya' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Chaya', 'Forward the Wells Fargo email to the accounts receivable contact for confirmation', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Chaya' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Chaya', 'Use Ben''s login to connect new Amex cards', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Chaya' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Chaya', 'Exclude all transactions from reconciled periods in the Match Bank Data screen', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Chaya' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Chaya', 'Begin daily reconciliation in the Match Bank Data screen', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Chaya' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Provide in-person bank training to Estefany', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ============================================================
-- TASKS: Sales & Customer Management
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Launch Order Entry System', 'In Progress', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Peter', 'Recruiter Sales Manager Follow-up', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Peter' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Sarah', 'Daily Reminder Emails to Sales Teams', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Sarah' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Sarah', 'Test Customer Access', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Sarah' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Customer not ordering — review and action', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Lost Customer Status — have other sales rep attempt outreach', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'New Customer Report', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Texting App — evaluate and implement', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create GP sales report for Luke', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Selling GP — strategy/process', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Quote — Create in advanced PDF format (same as Sales Order)', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Quote — transaction forms in NetSuite', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Print without barcode (physical) and with barcodes (emailed version)', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='sales' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ============================================================
-- TASKS: Website & Marketing
-- ============================================================
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Re-update the Item List on the website', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Bring brands into the website', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Yehuda', 'Provide final curated list of ~5,600 website products to Francis', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Yehuda' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Implement homepage redesign', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Compile list of missing product images for Luke', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Remove Size Chart page', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Fix login/create account and empty cart; enable wishlist', 'In Progress', 'Normal', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Replace "GP Petroleum" menu with "Brands" (201 entries)', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Increase search bar width and research full-width placement', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Test 5-product grid layout', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Implement Highline Warren''s "Shop by Brand" section with click-through functionality', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Add brands to SquareSpace Site', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Change size of Product Box', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Change size of Category boxes', 'Not Started', 'Normal', 14, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Pic Boxes Website Size', 'Not Started', 'Normal', 15, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Francis', 'Weekly Flyers / Promo Emails', 'Not Started', 'Normal', 16, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id
    AND per.name='Francis' AND per.project_id=p.id;

-- ============================================================
-- DOCUMENTS: Docs for Dashboard/
-- ============================================================
INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Oil Depot 2026',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Oil%20Depot%202026.docx?web=1',
    'docx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Oil Depot 2026 Board',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Oil_Depot_2026_1779153558.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Oil Depot Oct-Feb 2026 Board',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Oil_Depot_Oct_thru_Feb_2026_1779153514.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Oil Depot Website Board',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Oil_Depot_Website_1779153544.xlsx?web=1',
    'xlsx', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='website' AND w.project_id=p.id;

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Oil Depot Weekly To-Do Board',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Weekly_To_Do_Board_Oil_Depot_1779153574.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Inventory & Purchasing Role',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Inventory%20%26%20Purchasing%20Role.docx?web=1',
    'docx', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id;

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'TAP User Guide',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Microsoft%20Word%20-%20TAP%20User%20Guide.docx.pdf?web=1',
    'pdf', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Oil Depot Pricing Doc',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Oil%20Depot%20Pricing%20Doc.docx?web=1',
    'docx', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Workflow for Orders from Shopify',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/Workflow%20for%20Orders%20from%20Shopify.docx?web=1',
    'docx', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id;

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Getting Started with Fundamentals Training',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/Docs%20for%20Dashboard/The%20Oil%20and%20Lubricant%20Deport_Getting%20Started%20with%20Fundamentals%20Training.docx?web=1',
    'docx', 1
  FROM projects WHERE slug='oil-depot';

-- ============================================================
-- DOCUMENTS: 1C - Process Documents/ (zip contents)
-- ============================================================
INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Oil Depot Project To-Do',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/Oil_Depot_Project_ToDo.docx?web=1',
    'docx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'CPN Input SOP',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/CPN%20Input.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='netsuite-config' AND w.project_id=p.id;

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Keith Onboarding',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/KEITH.docx?web=1',
    'docx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Keith Transition Plan',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/Keith_Transition_Plan.docx?web=1',
    'docx', 1
  FROM projects WHERE slug='oil-depot';

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Routing Process',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/Routing%20Process%20%2803.25.25%29.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='shopify' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Smart Count Notes',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/Smart%20Count%20Notes.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Supply Plan Parameters in Detail',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/1%20-%20The%20Oil%20Depot/1C%20-%20Process%20Documents/Supply%20Plan%20Parameters%20in%20Detail.docx?web=1',
    'sop', 1
  FROM projects p, workflows w WHERE p.slug='oil-depot' AND w.slug='pricing-inventory' AND w.project_id=p.id;
