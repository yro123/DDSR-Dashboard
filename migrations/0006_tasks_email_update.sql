-- Migration 0006: New tasks and updates from status email (2026-05-18)
-- Source: team status email covering sync health, AP backlog, purchaser errors,
-- April close, MOLO reconciliation, Sightline, and open process questions.

-- ── NEW TASKS ─────────────────────────────────────────────────────────────────

-- "Live Syncs for the most part are working — getting a few individual errors that need to be looked into"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 2, 1, 'Adina', 'Investigate individual MOLO live sync errors post-cutover',
  'Live syncs are mostly working but a few individual errors need to be identified and resolved. Log each error as it surfaces.',
  'In Progress', 'High', 0, datetime('now'), datetime('now'));

-- "AP is transacting — @Stephanie very overloaded and overwhelmed with the whole backlog — let me know if there is anything we can do to help"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 1, 1, 'Adina', 'Check in with AP team on backlog — offer support to Stephanie and team',
  'AP is transacting but the team is overloaded with the backlog from the go-live period. Follow up with Stephanie Ferreira to see what help can be offered.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- "Purchasers are transacting in NetSuite — hitting some errors but working on resolving one by one (Cheri out this week)"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 3, 1, 'Adina', 'Continue resolving NetSuite purchaser transaction errors one by one',
  'Purchasers are live in NetSuite but hitting errors. Resolve one by one as they surface. Note: Cheri is out this week.',
  'In Progress', 'High', 0, datetime('now'), datetime('now'));

-- "Most important overall item — take a look at what is happening in the books AND close out April and confirm all numbers carried through"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 5, 2, 'Gretchen', 'Close out April period and confirm all go-live balances carried through correctly',
  'Top priority. Use the "1 – Everything Search" report in NetSuite to review Bills, Bill Payments, Invoices, Customer Payments by date range. Review GL Impact. Confirm April numbers are clean before period lock.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- "Reconciling all Imports — MOLO — Item Receipts / Vendor Bills"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 2, 1, 'Adina', 'Reconcile MOLO import: Item Receipts and Vendor Bills vs Molo Books',
  'Verify item receipts and vendor bills imported from MOLO match source records in Molo books.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- "Reconciling all Imports — MOLO — GL Amounts"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 2, 1, 'Adina', 'Reconcile MOLO import: GL Amounts vs Molo Books',
  'Reconcile general ledger amounts that came through the MOLO import against the Molo source records.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- "Sightline — continue working on the trial balance and then start a strategy for May (which numbers coming in or not)"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 5, 3, 'Jenna', 'Continue Sightline trial balance reconciliation and define May strategy',
  'Continue reconciling the Sightline trial balance in NetSuite. Once stable, define the strategy for May — which numbers are coming in and which are not.',
  'In Progress', 'High', 0, datetime('now'), datetime('now'));

-- "Review the Trial Balance for May Period — review overall trial balance/P&L for May to see how current transactions are hitting / what is alarming"
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 5, 2, 'Gretchen', 'Review May period trial balance and P&L — flag anything alarming',
  'Begin reviewing the overall trial balance and P&L for the May period to see how current transactions are hitting and identify anything alarming early.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- "Molo process discussions — SubContractor Tracking" (brand new open item)
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 2, 1, 'Adina', 'Define SubContractor Tracking process in MOLO and NetSuite',
  'Open process question from MOLO implementation: how subcontractor work is tracked across MOLO and NetSuite. Needs team discussion and a decision before it can be configured.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- "Molo process discussions — POE (not Molo — but Service)" (brand new open item)
INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, notes, status, priority, sort_order, created_at, updated_at)
VALUES (1, 6, 1, 'Adina', 'Resolve POE (Point of Entry) process for Service side — separate from MOLO',
  'Open process question: POE workflow for the Service side of the business. Not a MOLO issue — needs its own separate discussion and resolution.',
  'Not Started', 'High', 0, datetime('now'), datetime('now'));

-- ── UPDATES TO EXISTING TASKS ─────────────────────────────────────────────────

-- Task 38: "Confirm AR ledger tie-out against Molo report" — explicitly called out as priority reconciliation
UPDATE tasks SET
  priority = 'High',
  notes = 'High priority reconciliation item called out 2026-05-18. Reconcile AR Aging between NetSuite and MOLO books.',
  updated_at = datetime('now')
WHERE id = 38;

-- Task 39: "Review inventory tie-out for all sites" — called out as priority (quantities only, values will differ)
UPDATE tasks SET
  priority = 'High',
  notes = 'High priority reconciliation item called out 2026-05-18. Focus on Inventory Quantities — values will have a known difference.',
  updated_at = datetime('now')
WHERE id = 39;

-- Task 43: "Discuss the internal WO cost capture issue with Jenna" — Internal Work Orders still an open process question
UPDATE tasks SET
  notes = 'Open MOLO process discussion still unresolved as of 2026-05-18. Internal Work Order cost capture process needs to be defined and agreed upon.',
  updated_at = datetime('now')
WHERE id = 43;

-- Task 60: "Schedule a meeting to define the WIP accounting model" — still explicitly open per email
UPDATE tasks SET
  notes = 'Open MOLO process discussion still unresolved as of 2026-05-18. WIP Accounting model has not been defined. Critical to resolve before MOLO reporting can be accurate.',
  updated_at = datetime('now')
WHERE id = 60;
