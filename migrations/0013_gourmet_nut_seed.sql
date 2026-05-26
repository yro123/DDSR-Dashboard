-- Gourmet Nut seed migration
-- Workflows, people, tasks, and documents for slug='gourmet-nut'
-- Source: Doc for Dashboard + 3 OneDrive zips (Process Documents on SharePoint)
-- SP base: https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut

-- ============================================================
-- 1. WORKFLOWS
-- ============================================================

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'ar-collections', 'AR & Collections', 'AR', 1
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'finance-accounting', 'Finance & Accounting', 'Finance', 2
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'banking', 'Banking & Cash', 'Banking', 3
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'mrp-operations', 'MRP & Operations', 'MRP', 4
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO workflows (project_id, slug, name, short_name, sort_order)
  SELECT id, 'reporting', 'Reporting & Analytics', 'Reporting', 5
  FROM projects WHERE slug='gourmet-nut';

-- ============================================================
-- 2. PEOPLE
-- ============================================================

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Adina', 'Consultant', 'ddsr' FROM projects WHERE slug='gourmet-nut';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Pedro', 'Finance / AR', 'client' FROM projects WHERE slug='gourmet-nut';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Avi', 'Ownership', 'client' FROM projects WHERE slug='gourmet-nut';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Jenny', 'CPA / CBIZ', 'vendor' FROM projects WHERE slug='gourmet-nut';

INSERT INTO people (project_id, name, role, org_type)
  SELECT id, 'Floret Team', 'AR Team', 'client' FROM projects WHERE slug='gourmet-nut';

-- ============================================================
-- 3. TASKS — ar-collections (29 active + 3 Done)
-- ============================================================

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Investigate Amazon Remittance', 'In Progress', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Clear Emily''s Unapplied Payments', 'In Progress', 'Critical', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Match Open RMAs To Invoice Balances', 'In Progress', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Email Morris, Abraham, Joseph, and shipping/warehouse managers with Target compliance fee data', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Continue reconciling the Kroger account', 'In Progress', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Follow up with HEB on assigning a new vendor admin', 'In Progress', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Create a "watch list" for high-risk accounts (e.g., Nick)', 'Not Started', 'Critical', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Floret Team', 'Add Amazon as Customer', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Floret Team' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Floret Team', 'Add Delhaize as a Customer', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Floret Team' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Floret Team', 'Add Walmart as a Customer', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Floret Team' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Email sales rep (Joseph/Abraham) re: CNS portal access; then set up', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Research Delhaize underpayments; clear legacy CMs; create RMA for damages; verify BOL/QA', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Write off Generic Customer AR balance', 'Not Started', 'Critical', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Review HomeGoods AR; write off ~$2k', 'Not Started', 'Normal', 14, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Place Lane on hold; email Joseph/Abraham/Morris/Nick + customer; create watch list', 'Not Started', 'Critical', 15, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Forward Addresses for UNFI to Floret', 'Not Started', 'Normal', 16, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Create Target/Marshall as parent/child relationship', 'Not Started', 'Normal', 17, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Reschedule the AR meeting to the 1st Monday of each month', 'Not Started', 'Normal', 18, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Get AFIS contact names from Dennis to request full portal access', 'Not Started', 'Normal', 19, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Follow up with CNS Wholesale Grocers for portal access', 'Not Started', 'Normal', 20, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Contact the insurance broker directly for the HEB COI if Diana doesn''t respond', 'Not Started', 'Normal', 21, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Propose the TJX parent-child account structure to Joe', 'Not Started', 'Normal', 22, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Contact UNFI to request full portal access', 'Not Started', 'Normal', 23, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Discuss Target chargeback policies with broker Terry on April 1st', 'Not Started', 'Normal', 24, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Pedro', 'Notify Joe/Abraham about small accounts requiring pre-order checks', 'Not Started', 'Normal', 25, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Pedro' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Instruct Pedro on the required Brand field process for credit memos', 'In Progress', 'Normal', 26, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Coordinate with Pedro on the TJX proposal to Joe', 'Not Started', 'Normal', 27, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Investigate the cause of payment issues at Target', 'Not Started', 'Critical', 28, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Schedule the monthly AR meeting for the first Monday of each month', 'Not Started', 'Normal', 29, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ar-collections Done tasks (from Next Quarter board, no assignee)
INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Match Customer Accounts to Portals', 'Done', 'Normal', 30, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'New Process for RMA Going forward', 'Done', 'Normal', 31, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Resolve Current Bugs with AR Process', 'Done', 'Normal', 32, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id;

-- ============================================================
-- 4. TASKS — finance-accounting (28 active)
-- ============================================================

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Send the current ADP GL mapping report to Adina', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Provide Joseph and Adina with NJM workers'' comp rates by category', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Continue verifying 2025 financials, focusing on month-by-month P&L review', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Grant Joseph ADP access after his enrollment is complete', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Join the call with Jenny to resolve the tax issue and clarify audit requirements', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Define the desired granularity for the new cost codes with Adina on Monday', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Post the $85k bad debt write-off for the GE receivable', 'Not Started', 'Critical', 7, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Reverse the $96k 2024 tax accrual', 'Not Started', 'Critical', 8, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Schedule a call with Jenny (CBIZ) for next Monday to discuss the RE tax issue and manage the audit timeline', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Investigate the QuickBooks history to resolve the ~$146k bank variance and $71k intercompany mismatch', 'Not Started', 'Critical', 10, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Jenny', 'Connect with Adina to define the required trial balance format for CBIZ''s system', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Jenny' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Calculate and adjust the $520k accrued discount based on actual 2026 chargebacks', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Research GE''s history with Abraham Einhorn to find the missing data needed to balance its books', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Jenny', 'Recalculate 2025 depreciation and prepare an adjustment entry', 'Not Started', 'Critical', 14, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Jenny' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Discuss the $1.9M inventory variance with Morris to determine the reserve/write-off strategy', 'Not Started', 'Critical', 15, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Expense the $30k FMLA liability', 'Not Started', 'Critical', 16, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Jenny', 'Prepare supplemental schedules for the bank once financials are finalized', 'Not Started', 'Normal', 17, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Jenny' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Draft a new lease agreement for the $150k/month RE rent', 'Not Started', 'Critical', 18, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Finalize financials and provide a clean trial balance to CBIZ', 'Not Started', 'Normal', 19, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Reconcile the 401k employer match with Avi and Diana', 'Not Started', 'Normal', 20, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Contact Abraham Einhorn for Gourmet Essentials loan history', 'Not Started', 'Normal', 21, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Finalize inventory adjustment with Avi', 'Not Started', 'Critical', 22, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Provide GL detail for 2025 fixed asset additions', 'Not Started', 'Normal', 23, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Attend the monthly meeting consistently, even if late', 'Not Started', 'Normal', 24, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Reconcile W-2s to the GL payroll expense', 'Not Started', 'Normal', 25, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Provide a breakdown of distributions vs. PTET payments', 'Not Started', 'Normal', 26, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Provide Q1 2026 GL for analytical review', 'Not Started', 'Normal', 27, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Finance Manger – JD – Get confirmation – sent to Diana', 'Not Started', 'Normal', 28, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ============================================================
-- 5. TASKS — banking (4 active)
-- ============================================================

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Fix Bank Imports/ Auto Feeds', 'In Progress', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Request an extension from Bank of America for the April 30 covenant deadline', 'Not Started', 'Critical', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Follow up BOA – Cash Pro Connect', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create Saved Report for BOA Covenant Template', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='banking' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ============================================================
-- 6. TASKS — mrp-operations (3 active)
-- ============================================================

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Start Utilizing Blanket POs', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Avi', 'Get in-service dates for pallet robots from Avi Aroussi', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id
    AND per.name='Avi' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Monitor APHIS portal daily for updates on the 7 claims', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ============================================================
-- 7. TASKS — reporting (6 active)
-- ============================================================

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Meeting re WIP / Costing Reports needed', 'Not Started', 'Normal', 1, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Look into creating a COGM Statement (Financial Report Setup)', 'Not Started', 'Normal', 2, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Consult Thomas re: comparative P&L options/limitations', 'Not Started', 'Normal', 3, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Provide a consolidated sales report that ties to the P&L', 'Not Started', 'Normal', 4, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Create Separate Tab for Reports', 'Not Started', 'Normal', 5, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, assignee_id, assignee_name, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, per.id, 'Adina', 'Send excel sheet with list of reports to go into each tab to Tomas', 'Not Started', 'Normal', 6, 0
  FROM projects p, workflows w, people per
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id
    AND per.name='Adina' AND per.project_id=p.id;

-- ============================================================
-- 8. DOCUMENTS
-- ============================================================

-- Doc for Dashboard — project-level
INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Weekly To-Do Board — Gourmet Nut',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Doc%20for%20Dashboard/Weekly_To_Do_Board_Gourmet_Nut_1779153960.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'Gourmet Nut Next Quarter',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Doc%20for%20Dashboard/Gourmet_Nut_Next_Quarter_1779153945.xlsx?web=1',
    'xlsx', 1
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'NEW LLC',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/NEW%20LLC.docx?web=1',
    'docx', 1
  FROM projects WHERE slug='gourmet-nut';

INSERT INTO documents (project_id, name, url, doc_type, is_active)
  SELECT id, 'GN Lease Agreement with RE',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/GN%20Lease%20Agreement%20with%20RE.pdf?web=1',
    'pdf', 1
  FROM projects WHERE slug='gourmet-nut';

-- Doc for Dashboard — ar-collections
INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Item Receipt Differences',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Doc%20for%20Dashboard/Item%20Receipt%20Differences.docx?web=1',
    'sop', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Job Description — AR Manager',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/Job%20Description%20-%20AR%20Manager.docx?web=1',
    'docx', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='ar-collections' AND w.project_id=p.id;

-- finance-accounting documents
INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'GN Finance Manager Role',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/GN%20Finance%20Manager%20Role.docx?web=1',
    'docx', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Accounting Dept. Support Role',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/Accounting%20Dept/Accounting/Accounting%20Dept.%20Support%20Role%20.docx?web=1',
    'docx', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Gourmet Nut Accounting 04.10.25',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/Accounting%20Dept/Accounting/Gourment%20Nut%20Accounting%2004.10.25.docx?web=1',
    'sop', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Gourmet Nut Accounting 04.28.25',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/Accounting%20Dept/Accounting/Gourment%20Nut%20Accounting%2004.28.25.docx?web=1',
    'sop', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Gourmet Nut Finance Dept.',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/Accounting%20Dept/Accounting/Gourment%20Nut%20Finance%20Dept..docx?web=1',
    'sop', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

-- mrp-operations documents
INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Write Up of Co-Packer Assemblies',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Doc%20for%20Dashboard/Write%20Up%20of%20Co-Packer%20Assemblies%20-%20Adina%20Reis%20-%20Outlook.pdf?web=1',
    'pdf', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Inbound Logistics Co-Ordinator',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/MRP/Inbound%20Logistics%20Co-Ordinator%20.docx?web=1',
    'docx', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Interview Qs for Supply Chain Role',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/MRP/Interview%20Qs%20for%20Supply%20Chain%20Role.docx?web=1',
    'docx', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'MRP Parameters',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/MRP/MRP%20-%20Parameters.docx?web=1',
    'sop', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id;

INSERT INTO documents (project_id, workflow_id, name, url, doc_type, is_active)
  SELECT p.id, w.id, 'Version 2 — Supply Chain Coordinator',
    'https://datadrivensr.sharepoint.com/sites/DataDrivenSolutionsReporting/Shared%20Documents/4%20-%20Gourmet%20Nut/Process%20Documents/MRP/Version%202%20-%20Supply%20Chain%20Coordinator%20.docx?web=1',
    'docx', 1
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='mrp-operations' AND w.project_id=p.id;
