PRAGMA foreign_keys = OFF;

-- ── PROJECT ───────────────────────────────────────────────────────────────
INSERT INTO projects (id, name, client_display_name, subtitle, slug, go_live_date, project_start_date, is_active)
VALUES (1, 'Hinckley Yacht', 'Hinckley', 'Project implementation dashboard', 'hinckley', '2026-04-27', '2026-01-01', 1);

-- ── PEOPLE ────────────────────────────────────────────────────────────────
INSERT INTO people (id, project_id, name, role, org_type, avatar_bg, avatar_fg, is_active) VALUES
(1,  1, 'Adina',                   'Project Manager',  'Partner',  '#DBEAFE', '#1E40AF', 1),
(2,  1, 'Gretchen',                'Finance Lead',     'Client',   '#EDE9FE', '#5B21B6', 1),
(3,  1, 'Jenna',                   'Finance',          'Client',   '#FFE4E6', '#9F1239', 1),
(4,  1, 'Leslie',                  'AP',               'Client',   '#DCFCE7', '#166534', 1),
(5,  1, 'Stephanie',               'HR / Finance',     'Client',   '#FEE2E2', '#991B1B', 1),
(6,  1, 'Nicole',                  'Controller',       'Client',   '#D1FAE5', '#064E3B', 1),
(7,  1, 'Cheri',                   'Purchaser',        'Client',   '#FCE7F3', '#831843', 1),
(8,  1, 'NetSuite Implementation', 'Implementation',   'Partner',  '#D1FAE5', '#065F46', 1),
(9,  1, 'MOLO Team',               'Vendor',           'Vendor',   '#E0F2FE', '#0369A1', 1),
(10, 1, 'Vic.AI Team',             'Vendor',           'Vendor',   '#FEF3C7', '#92400E', 1),
(11, 1, 'Unassigned',              NULL,               NULL,       '#F3F4F6', '#6B7280', 1),
(12, 1, 'Brian',                   'Executive',        'Client',   '#FEF9C3', '#854D0E', 1),
(13, 1, 'Harrison',                'Developer',        'Partner',  '#DBEAFE', '#1E3A8A', 1),
(14, 1, 'Lou',                     'CFO',              'Client',   '#F3F4F6', '#374151', 1),
(15, 1, 'Steven',                  'Purchaser',        'Client',   '#D1FAE5', '#065F46', 1),
(16, 1, 'Chad',                    'Purchaser',        'Client',   '#FEE2E2', '#7F1D1D', 1),
(17, 1, 'Justin',                  'Purchaser',        'Client',   '#EDE9FE', '#4C1D95', 1),
(18, 1, 'Tracy',                   'AP',               'Client',   '#FCE7F3', '#701A75', 1);

-- ── WORKFLOWS ─────────────────────────────────────────────────────────────
INSERT INTO workflows (id, project_id, slug, name, short_name, description, color, bg_color, phase, icon, sort_order, is_active) VALUES
(1, 1, 'vicai',      'Vic.AI / AP Automation',        'Vic.AI / AP',        'Invoice intake, 3-way PO matching, autonomous approval flows, vendor onboarding, ACH setup, payment reconciliation.', '#F59E0B', '#FFFBEB', 'Stabilizing', '🧾', 1, 1),
(2, 1, 'molo',       'MOLO ↔ NetSuite Integration',   'MOLO Integration',   'Bi-directional sync between MOLO and NetSuite. Item strategy, WIP fix, boat records, customer/vendor lists, go-live cutover.', '#22C55E', '#F0FDF4', 'In Progress', '🔄', 2, 1),
(3, 1, 'purchasing', 'NetSuite Purchasing',            'NetSuite Purchasing','NetSuite replaces MOLO for all purchasing. PO creation, item receipts, item management, user roles, training.', '#3B82F6', '#EFF6FF', 'Go-Live',     '🛒', 3, 1),
(4, 1, 'paylocity',  'Paylocity / Concur / HR',       'Paylocity / Concur', 'Payroll JE automation, P-card/Concur expense process, employee reimbursements, new employee SOP.', '#A855F7', '#FAF5FF', 'In Progress', '👥', 4, 1),
(5, 1, 'financial',  'Financial Close & Reporting',   'Financial Close',    'Period locking, trial balance imports, REVREC, intercompany elimination, production overhead allocation, BI data lake.', '#14B8A6', '#F0FDFA', 'In Progress', '📊', 5, 1),
(6, 1, 'sysconfig',  'System Configuration',          'System Config',      'NetSuite COA restructure, GL locks, roles & permissions, features configuration, Sightline GL mapping.', '#64748B', '#F8FAFC', 'In Progress', '⚙️', 6, 1);

-- ── WORKFLOW OWNERS ───────────────────────────────────────────────────────
INSERT INTO workflow_owners (workflow_id, person_id, owner_name, sort_order) VALUES
(1,10,'Vic.AI Team',1),(1,4,'Leslie',2),(1,5,'Stephanie',3),(1,1,'Adina',4),
(2,1,'Adina',1),(2,9,'MOLO Team',2),(2,8,'NetSuite Implementation',3),
(3,8,'NetSuite Implementation',1),(3,2,'Gretchen',2),(3,4,'Leslie',3),(3,1,'Adina',4),
(4,5,'Stephanie',1),(4,2,'Gretchen',2),(4,6,'Nicole',3),
(5,2,'Gretchen',1),(5,3,'Jenna',2),(5,6,'Nicole',3),(5,8,'NetSuite Implementation',4),(5,1,'Adina',5),
(6,2,'Gretchen',1),(6,1,'Adina',2),(6,8,'NetSuite Implementation',3);

-- ── WORKFLOW STEPS ────────────────────────────────────────────────────────
-- vicai (1-7)
INSERT INTO workflow_steps (id, workflow_id, label, status, sort_order) VALUES
(1,1,'Vendor onboarding & ACH setup','In Progress',1),
(2,1,'Invoice intake & AI predictions','Done',2),
(3,1,'3-Way PO matching & Sightline mapping','In Progress',3),
(4,1,'Approval flow configuration (~64 approvers)','Done',4),
(5,1,'Payment reconciliation process','In Progress',5),
(6,1,'Sightline credit process definition','Not Started',6),
(7,1,'Prepayment workaround documented','Not Started',7),
-- molo (8-14)
(8,2,'Item list sync (inventory items)','In Progress',1),
(9,2,'Customer & vessel data review','In Progress',2),
(10,2,'Boat record review & ownership history','In Progress',3),
(11,2,'WIP band-aid fix deployed','Not Started',4),
(12,2,'LOA UoM mapping error fixed','Not Started',5),
(13,2,'Labor cost sync on internal invoices','Not Started',6),
(14,2,'Work Order → PO automation scoped','Not Started',7),
-- purchasing (15-20)
(15,3,'MOLO POs migrated to NetSuite (Apr 26)','Done',1),
(16,3,'User roles assigned (Procurement Manager 1B)','Done',2),
(17,3,'2FA and user preferences configured','In Progress',3),
(18,3,'Item data fixes imported','In Progress',4),
(19,3,'PO numbering system live','Done',5),
(20,3,'Future: WO → PO auto-creation','Not Started',6),
-- paylocity (21-26)
(21,4,'Paylocity JE import tested & approved','In Progress',1),
(22,4,'Paylocity JE automation configured','Not Started',2),
(23,4,'Concur P-card export mapped to JE template','Not Started',3),
(24,4,'P-card test import run with approval','Not Started',4),
(25,4,'Employee reimbursement flow confirmed','Done',5),
(26,4,'New employee SOP published','Done',6),
-- financial (27-33)
(27,5,'April period locked in NetSuite','Done',1),
(28,5,'Trial balance imported & reconciled','In Progress',2),
(29,5,'Revenue recognition (REVREC) configured','In Progress',3),
(30,5,'Intercompany clearing process defined','Not Started',4),
(31,5,'Production overhead allocation automated','Not Started',5),
(32,5,'BI / data lake project kicked off','Not Started',6),
(33,5,'Management reporting package built','In Progress',7),
-- sysconfig (34-40)
(34,6,'COA restructured & accounts renamed','In Progress',1),
(35,6,'GL creation locked to Lou + Gretchen','In Progress',2),
(36,6,'Roles assigned (Leslie, Tracy, new users)','In Progress',3),
(37,6,'Sandbox visual cue applied','Not Started',4),
(38,6,'NetSuite features configured','In Progress',5),
(39,6,'Sightline GL mapping corrected','Done',6),
(40,6,'Exception Management enabled on dashboards','Not Started',7);

-- ── WORKFLOW STEP DETAILS ─────────────────────────────────────────────────
INSERT INTO workflow_step_details (id, workflow_step_id, summary) VALUES
(1,1,'Vendors enrolled in ACH payments via VicPay. New vendors with exact name match auto-enrolled; otherwise paid by check.'),
(2,2,'Bills retrieved from vendor portals or forwarded via email. Invoice document pushed to NetSuite under the Communication tab.'),
(3,3,'Vic.ai syncs with NetSuite for PO and receipt data every 30 minutes. Matching at PO line level: Ordered Qty, Received Qty, Billed Qty.'),
(4,4,'Autonomous approval routing determined by vendor, amount, GL account, and dimension. First matching rule is triggered.'),
(5,5,'Vic.ai processes payments from its own bank account, funded by lump-sum transfers from Hinckley''s Bank of America.'),
(6,6,'No process currently exists for applying Sightline credits to POs in Vic.ai. Hinckley team must define an internal process.'),
(7,7,'Vic.ai is a one-way sync and cannot read payment data from NetSuite to automate prepayment linking.'),
(8,8,'Items categorized into three buckets with different sources of truth. NetSuite is SOT for inventory and special order items.'),
(9,9,'Storage and service customers created in MOLO and pushed to NetSuite. One customer record in each system, synced on changes.'),
(10,10,'Boat records created in MOLO (service & storage) and Sightline (brokerage/sales). Synced to NetSuite as custom records via MOLO bundle.'),
(11,11,'Short-term fix for WIP inventory discrepancy. When MOLO sends month-end WIP journal entry, it also sends an inventory adjustment to NetSuite.'),
(12,12,'LOA (Length Overall) unit of measure is mapping incorrectly between MOLO and NetSuite.'),
(13,13,'Labor costs from internal work orders are not syncing correctly to NetSuite invoices.'),
(14,14,'Long-term goal: auto-create POs directly from Work Orders in MOLO, eliminating double entry.'),
(15,15,'All active MOLO POs migrated to NetSuite on April 26. Receiving against these POs must now be done in NetSuite.'),
(16,16,'New users Tracy, Justin, and Sherry assigned the Procurement Manager 1B role. Gretchen creates all user accounts.'),
(17,17,'Users must configure NetSuite preferences for optimal purchasing workflow.'),
(18,18,'Missing base pricing and non-inventory item setup issues being resolved via import.'),
(19,19,'NetSuite PO numbering uses a location prefix + 4-digit number to distinguish from MOLO POs.'),
(20,20,'Future optimization: auto-create POs directly from Work Orders, eliminating double entry.'),
(21,21,'Weekly payroll journal entry import process tested. Two-entry process confirmed working.'),
(22,22,'Automating the weekly Paylocity JE upload so it no longer needs to be manually uploaded.'),
(23,23,'P-card data is a mix of standalone expenses and PO-backed purchases. Mapping separates them to prevent duplicate payments.'),
(24,24,'Test import must be run and approved by Jenna and Nicole before go-live.'),
(25,25,'Employee reimbursement process confirmed — processed in Paylocity, flows through as weekly JE.'),
(26,26,'SOP created for adding new employees to NetSuite with correct access, subsidiary, department, and location.'),
(27,27,'NetSuite period ending April 26 locked on Monday. All new transactions must post to April 27 or later.'),
(28,28,'Historical trial balances being imported into NetSuite. Delta analysis run after each import.'),
(29,29,'Revenue Recognition is on in NetSuite. Revenue Commitments is off — needed for recognizing unbilled revenue.'),
(30,30,'~30-40 intercompany invoices per month currently handled manually. Goal: automate using NetSuite rules.'),
(31,31,'Monthly production overhead allocation automated in NetSuite using Dynamic Allocation schedules and Statistical Accounts.'),
(32,32,'BI team meeting scheduled to kick off the data lake project. Reporting timelines being discussed.'),
(33,33,'Management report package being built in NetSuite including Service P&L, balance sheet, and allocation schedules.'),
(34,34,'Chart of accounts being restructured — accounts renamed, inactivated, and grouped. Import mappings updated.'),
(35,35,'GL creation and changes in NetSuite restricted to Lou and Gretchen only to maintain data integrity.'),
(36,36,'NetSuite user roles being assigned and configured for all new users.'),
(37,37,'Visual cue applied to Sandbox environment to clearly distinguish it from Production.'),
(38,38,'NetSuite feature flags reviewed and configured. Unused features disabled to reduce clutter.'),
(39,39,'Sightline location and department mapping errors identified and corrected.'),
(40,40,'Exception Management portlet being enabled on all user dashboards to surface issues proactively.');

-- ── WORKFLOW STEP DETAIL POINTS ───────────────────────────────────────────
INSERT INTO workflow_step_detail_points (step_detail_id, point_text, sort_order) VALUES
-- step 1: vendor onboarding
(1,'Bank account linked in Vic.ai Admin > Payables — micro-deposit verification complete',1),
(1,'ACH whitelisting: Stephanie whitelists Vic.ai''s ACH details (company ID, org name) with the bank',2),
(1,'Only Vendor Manager users (Stephanie, Leslie, Tracy) can view or add ACH details',3),
(1,'Vivian uploading initial ACH details — use Invite Vendor feature for new vendors',4),
(1,'Many vendor records lack email addresses — requires mail-based onboarding campaign',5),
(1,'Vivian providing public dashboard link to monitor vendor sign-up progress',6),
(1,'New vendors must be created in NetSuite first before they appear in Vic.ai',7),
-- step 2: invoice intake
(2,'Attachments now syncing correctly to NetSuite (confirmed in UAT)',1),
(2,'Freight: AI predicts freight lines — identified freight treated as an expense',2),
(2,'Taxes: Expense line created for tax on both PO and non-PO invoices',3),
(2,'Missing invoice number: Vic.ai predicts one using account number + date',4),
(2,'Hyperlink invoices: Cannot retrieve — vendors must send attachments instead',5),
(2,'If vendor cannot send attachments, an exception workflow is required',6),
(2,'AP Inbox pending activation — Thomas from Vic.ai applied fix, 72-hour delay reported',7),
(2,'Mass invoice upload: Leslie can upload ~500 saved invoices by selecting all in a folder',8),
-- step 3: 3-way PO matching
(3,'Manual syncs can be triggered in Vic.ai for faster testing',1),
(3,'Max matchable amount = remaining PO quantity x PO unit price',2),
(3,'PO Requester field must contain a valid Vic.ai user — defaults to Tracy if blank or invalid',3),
(3,'Sightline location mapping fix: SNAP > Naples, SSTU > Stewart (corrected)',4),
(3,'Sightline department fix: was routing to CLIENT NAME (ID 1) instead of Hinckley Services (ID 10) — fixed by Julian',5),
(3,'Sightline PO sync: PENDING — requires GL mapping fix and sandbox testing first',6),
(3,'No process currently exists for applying Sightline credits to POs — action item for Hinckley team',7),
-- step 4: approval flows
(4,'~64 approvers configured across all flows',1),
(4,'PO mismatches >10% quantity difference or >$100 value — routed to PO Requester',2),
(4,'Standalone bills >$5k — routed to site-specific General Manager',3),
(4,'Standalone bills <$5k — routed manually by Tracy/Leslie for GL code review',4),
(4,'Flows processed top-to-bottom — bill approved by first matching flow',5),
(4,'Post-approval edits must be made via correction journal in NetSuite — do NOT un-approve the bill',6),
(4,'PO mismatch tolerance set for quantity, unit price, and line amount',7),
-- step 5: payment reconciliation
(5,'One bank account used for all AP payments',1),
(5,'Hinckley transfers the full batch amount to Vic.ai',2),
(5,'In NetSuite: match the lump-sum bank debit to the full batch of individual bill payments',3),
(5,'Vic.ai provides a monthly report of outstanding (un-cashed) checks',4),
(5,'Hinckley books a liability for outstanding checks to ensure accurate financials',5),
(5,'Check void/reissue: Vic.ai automatically voids and reissues checks not cashed within 30 days',6),
(5,'All stop-pays and reissues must be handled by Vic.ai — not Hinckley',7),
-- step 6: sightline credit
(6,'Vic.ai treats Sightline PO lines as expense lines — direct credit application not possible',1),
(6,'Credits cannot be applied when balance due is less than total credit amount',2),
(6,'Hinckley team needs to define and document the internal process',3),
(6,'Adina assigned to develop the process',4),
(6,'Blocking issue for full Sightline integration',5),
-- step 7: prepayment
(7,'Current process: check request > prepayment tracked in separate account > manually applied upon receipt',1),
(7,'Workaround: manually mark the final invoice as paid in Vic.ai',2),
(7,'Long-term: research native NetSuite prepayment features',3),
(7,'Prepayment feature in NetSuite is on but complex — team may disable to prevent errors',4),
(7,'Action: Adina to research native NetSuite prepayment features',5),
-- step 8: item list sync
(8,'Bucket 1 (MOLO SOT): Non-physical items — labor rates, environmental fees, service charges',1),
(8,'Bucket 2 (NetSuite SOT): Special order items — non-inventoried, one-off jobs',2),
(8,'Bucket 3 (NetSuite SOT): Tracked inventory items — reorderable physical parts',3),
(8,'Duplicate detection based on External ID — if exists, adds to existing item record',4),
(8,'Multi-location items: NetSuite is source of truth, updates pushed to all locations',5),
(8,'Single-location items: MOLO is source of truth',6),
(8,'Subcontractor category on hold due to complex workflows',7),
-- step 9: customer & vessel
(9,'148 customers currently in NetSuite — mostly test customers to be deleted',1),
(9,'Duplicate detection enabled in NetSuite based on Phone + Email',2),
(9,'Sales and brokerage customers live exclusively in Sightline for Phase One',3),
(9,'Any update to a MOLO customer gets pushed to NetSuite',4),
(9,'Missing data: Sales rep, category, departments, preferences, credit limit, terms',5),
(9,'Dimitri following up on item and customer list data gaps',6),
-- step 10: boat records
(10,'Record includes: HIN, name, Make/Model, Year, Length, Beam, Square Footage',1),
(10,'Boat record updates when ownership changes — script in NetSuite handles this',2),
(10,'Tested in Sandbox — needs further validation in Production',3),
(10,'Ownership History script: Adina following up with Harrison on documentation',4),
(10,'Import from Sightline to NetSuite deferred to Phase 2',5),
(10,'Brian discussing boat record data priority with Andrew',6),
-- step 11: WIP fix
(11,'Problem: NetSuite only decrements inventory when final invoice created, not at WIP stage',1),
(11,'MOLO decrements inventory in real-time when item issued to work order',2),
(11,'Band-aid: deduct WIP from MOLO inbound sync, push WIP count to NetSuite custom field',3),
(11,'Pro: fixes month-end financials. Con: NetSuite inventory inaccurate mid-month',4),
(11,'Long-term fix: send MOLO work orders to NetSuite as Sales Orders (major scope expansion)',5),
(11,'Patrick assigned to implement the band-aid fix',6),
-- step 12: LOA UoM
(12,'Patrick assigned to investigate and fix the LOA UoM mapping error',1),
(12,'Impacts boat record accuracy and potentially inventory calculations',2),
(12,'Related to the broader item sync and UoM standardization effort',3),
-- step 13: labor cost sync
(13,'Patrick investigating why labor costs not syncing on internal invoices',1),
(13,'Workaround: continue using manual journal entry until MOLO fix deployed',2),
(13,'Intercompany job checkbox must correctly route revenue — Patrick/Adina confirming',3),
(13,'MOLO lacks a job-level field to tag transaction types (Warranty, Sales, etc.)',4),
(13,'Adina discussing the internal WO cost capture issue with Jenna',5),
-- step 14: WO to PO
(14,'Contact: Dan Nelson at MOLO for timeline and cost estimate',1),
(14,'Full flow: MOLO Work Order > NetSuite Sales Order > PO > Receipt > Fulfillment > MOLO WO Update',2),
(14,'Pro: solves inventory accuracy, enables linked purchasing, reduces manual entry',3),
(14,'Con: major scope expansion — could delay May 1st go-live',4),
(14,'Brian assigned to contact Dan Nelson at MOLO for timeline',5),
(14,'Create a consolidated list of critical vs Phase 2 items for Dan resource planning',6),
-- step 15: MOLO POs migrated
(15,'Go-live date: April 27 — purchasing migrated from MOLO to NetSuite',1),
(15,'All new transactions must be dated April 27 or later',2),
(15,'Harrison wiped the production environment and notified Patrick to begin MOLO sync',3),
(15,'MOLO purchasing disabled after go-live',4),
(15,'PO numbering: [3-letter location prefix] + [4-digit number starting at 5000] e.g. BBM-5000',5),
-- step 16: user roles
(16,'Role: Procurement Manager 1B for new purchasing users',1),
(16,'Gretchen creates all user accounts and roles in NetSuite',2),
(16,'Two-Factor Authentication (2FA) required for all users',3),
(16,'Scan QR code using Google Authenticator or Microsoft Authenticator',4),
(16,'Select Remember Me for 30 Days on login to reduce daily prompts',5),
(16,'If login fails: re-scan the QR code to link the correct Production NetSuite account',6),
-- step 17: 2FA preferences
(17,'General tab: Set From Email Address and Email Signature',1),
(17,'Uncheck: Use Multicurrency Expense Reports',2),
(17,'Uncheck: Enable NetSuite Guided Learning',3),
(17,'Set Number of Rows in List Segments to 1,000',4),
(17,'Appearance tab: Check Use Classic Interface (more efficient than ribbon menu)',5),
(17,'Set a Color Theme for visual distinction between accounts',6),
(17,'Dashboard: Remove KPI and Trend Graph portlets, keep Reminders and Shortcuts only',7),
-- step 18: item data fixes
(18,'Harrison importing item data fixes for missing base pricing',1),
(18,'Non-inventory item setup being corrected',2),
(18,'P&I Item checkbox created on the inventory item form',3),
(18,'Custom bin location table created on the item record',4),
(18,'Location-specific BIN added to the PO PDF',5),
(18,'Chad and Steven consulted on the P&I item strategy',6),
-- step 19: PO numbering
(19,'Format: [3-letter location prefix] + [4-digit number starting at 5000]',1),
(19,'Example: BBM-5000 for Baybridge Marina',2),
(19,'Avoids conflicts with MOLO POs (which use 4000s)',3),
(19,'Clearly identifies NetSuite POs at a glance',4),
(19,'Cheat sheet with NetSuite codes distributed to all purchasers',5),
-- step 20: future WO to PO
(20,'Full flow: MOLO Work Order > NetSuite Sales Order > PO > Receipt > Fulfillment',1),
(20,'Eliminates duplicate entry between MOLO and NetSuite',2),
(20,'Dan Nelson at MOLO being contacted for timeline and cost estimate',3),
(20,'Deferred to Phase 2 — not in current go-live scope',4),
-- step 21: paylocity JE tested
(21,'Entry 1 (Concur Journal): Debit all expense accounts with full segmentation, credit Reimbursement Liability account',1),
(21,'Entry 2 (Paylocity Journal): Debit Reimbursement Liability account, credit bank — clearing the balance',2),
(21,'NetSuite connector abandoned as non-functional — no expense reports created in NetSuite',3),
(21,'GL Codes and Approval Defaults must be correct before go-live',4),
(21,'Gretchen to confirm JE structure with Linda, test import with minimal backup',5),
(21,'Attach documentation in NetSuite for audit trail',6),
-- step 22: paylocity automation
(22,'Gretchen coordinating with Paylocity to finalize automation setup',1),
(22,'Employee reimbursement requests continue to be processed in Paylocity',2),
(22,'Reimbursements flow through as part of the weekly JE (one debit and one credit)',3),
(22,'Paylocity remains the source of truth for all employee data',4),
-- step 23: concur p-card
(23,'Standalone expenses: imported via journal entry weekly',1),
(23,'PO-backed transactions: filtered out and handled by Vic.ai as normal PO-backed bills',2),
(23,'Gretchen and Stephanie mapping the Concur P-card export to a NetSuite JE template',3),
(23,'Custom PO column in Concur being configured by Stephanie and Gretchen',4),
(23,'PCARD payment term created for payments made through Concur (Corp Card)',5),
-- step 24: p-card test
(24,'Gretchen and Stephanie to run test import with minimal backup',1),
(24,'Obtain Jenna and Nicole approval before go-live',2),
(24,'Vic.ai will use receipts as invoices when formal invoice is unavailable',3),
(24,'Needs testing in Vic.ai to confirm this works correctly',4),
(24,'VIT being asked to remove the CLIENT NAME department from the system',5),
-- step 25: reimbursement confirmed
(25,'Reimbursement requests continue to be processed in Paylocity',1),
(25,'Flows through as part of the weekly JE as one debit and one credit',2),
(25,'No changes needed to the reimbursement request process for employees',3),
-- step 26: new employee SOP
(26,'Navigate to: List > Employees > Employee > New',1),
(26,'Required: Name, initials, supervisor, subsidiary, email, role',2),
(26,'Set subsidiary to employee''s company by default',3),
(26,'Check Give Access and enable Notification Email',4),
(26,'Fill in Department and Location whenever possible to improve transaction automation',5),
(26,'Loom video: loom.com/share/c79852b799b6492fad5747a7750d39e7',6),
-- step 27: april period locked
(27,'Harrison locked the April 26 period in NetSuite on Monday',1),
(27,'April AP/AR periods also locked',2),
(27,'GL reversal journal entry posted on Monday morning',3),
(27,'Bill dates updated to April 27 — original dates moved to True Invoice Date field',4),
(27,'True Invoice Date: custom NetSuite field (mapped to field 5050) captures original invoice date',5),
-- step 28: trial balance
(28,'Gretchen managing all imports: 2025 monthly trial balances and 2026 pre-go-live data',1),
(28,'Import forces all historical transactions into the current NetSuite period (April 2026)',2),
(28,'After import: review AR Aging, AP Aging, and Inventory Report',3),
(28,'Create delta by comparing TB April 2026 before and after import',4),
(28,'Import a journal entry reversing the GL impact of the transactional import',5),
(28,'Lock prior MOLO periods to prevent backdating (locked through 03.31.2026)',6),
-- step 29: REVREC
(29,'Revenue Recognition: ON in NetSuite',1),
(29,'Revenue Commitments: OFF — Adina asked BCC for rationale',2),
(29,'Revenue Commitments needed for recognizing unbilled revenue',3),
(29,'REVREC Package Hierarchy needs to be confirmed by Jenna',4),
(29,'Revenue allocation report for packages being created by Harrison',5),
(29,'Nicole clarifying production''s RevRec needs in meeting with Gretchen',6),
-- step 30: intercompany
(30,'MOLO uses Intercompany Payment method to clear AR',1),
(30,'NetSuite reclassifies revenue/COGS for 5-10 intercompany customers',2),
(30,'Intercompany Clearing GL account being created in NetSuite',3),
(30,'New MOLO payment type being created to link to the new GL account',4),
(30,'AR/AP clearing process reviewed with Nicole and Brian for final approval',5),
(30,'MOLO lacks job-level field to tag transaction types — limits automation',6),
(30,'Laura digitizing the workflow; Harrison modeling solution in NetSuite',7),
-- step 31: overhead allocation
(31,'Timing: final month-end step, performed after revenue recognition',1),
(31,'Allocation weights are dynamic: Labor Hours (most depts), Material Spend (purchasing/stockroom)',2),
(31,'NetSuite Dynamic Allocation uses Statistical Accounts to define variable weights',3),
(31,'Statistical Journal Entries update balances — do not require balanced debit/credit',4),
(31,'Source tab: defines pool of expenses, credit account set to 5905 Applied Overhead',5),
(31,'Destination tab: defines boat lines and departments receiving allocated costs',6),
(31,'Requirement: allocation must be net zero',7),
-- step 32: BI data lake
(32,'Laura meeting with BI team on Monday to kick off the data lake project',1),
(32,'Follow-up with Jenna and Andrew to discuss reporting timelines',2),
(32,'GL Account Sync: no automatic sync exists — alert report of NetSuite GL changes for Jenna and Nicole',3),
(32,'Adina scheduling 1:1 with Jenna to discuss GL flow',4),
(32,'Financial schedules being built as Saved Searches in NetSuite',5),
-- step 33: management reporting
(33,'Gretchen building NetSuite Reports for Jenna — Service P&L Statements',1),
(33,'Management Report Creation in progress',2),
(33,'Financial schedules being built as Saved Searches',3),
(33,'Separate allocation schedules being built for all required GL accounts',4),
(33,'Final management package PDF sent to Adina',5),
(33,'R2R review with Adina scheduled',6),
(33,'Divya''s MOLO report email redirected to Jenna',7),
-- step 34: COA restructure
(34,'Gretchen restructuring COA: renaming, inactivating, and grouping accounts',1),
(34,'Update import mappings to reflect new account IDs',2),
(34,'GL 2818 being renamed to Temporary Deferred Revenue',3),
(34,'Intercompany Clearing GL account being created',4),
(34,'Add indirect expense GLs (e.g. Rent - Indirect) to chart of accounts',5),
(34,'Incorrect reports in NetSuite being renamed and removed',6),
(34,'Minor additions still needed for accounts from the 1/1/2025 trial balance',7),
-- step 35: GL lock
(35,'Adina locking down GL creation/changes in NetSuite to Lou + Gretchen',1),
(35,'Prevents unauthorized GL account creation across the organization',2),
(35,'All GL changes must start in NetSuite regardless of which system the vendor lives in',3),
(35,'Alert report of NetSuite GL changes distributed to Jenna and Nicole to replicate in MOLO/Syteline',4),
(35,'Period locking being implemented post-go-live to prevent posting to closed periods',5),
-- step 36: roles assigned
(36,'Correct NetSuite roles for Leslie and Tracy being requested from Gretchen',1),
(36,'Procurement Manager 1B role assigned to Tracy, Justin, Sherry',2),
(36,'Gretchen creates all user accounts and roles',3),
(36,'2FA required for all users — Google or Microsoft Authenticator',4),
(36,'Show Internal IDs enabled for stable data imports',5),
(36,'Rows per page increased to 1000 for large list navigation',6),
(36,'Duplicate Number Warnings set to Block to prevent duplicate bill numbers',7),
-- step 37: sandbox
(37,'Disable Redwood theme in Sandbox',1),
(37,'Apply a different color theme to visually distinguish Sandbox from Production',2),
(37,'Prevents accidental transactions in the wrong environment',3),
(37,'Classic Interface recommended — more efficient than ribbon menu',4),
(37,'Customize dashboards using Reminders, Shortcuts, and Custom Content portlets',5),
-- step 38: features configured
(38,'Multiple Currencies: grayed out due to existing test transactions',1),
(38,'Revenue Recognition: ON. Revenue Commitments: OFF (needs review)',2),
(38,'Inventory Costing: Group Average is OFF — intentional for location-specific costing',3),
(38,'Inventory Status: OFF — should be enabled post-go-live to track condition',4),
(38,'Consolidated Payments: OFF — Adina asking BCC why',5),
(38,'Prepayments: ON but complex — team may disable to prevent errors',6),
(38,'Period Locking: being implemented post-go-live',7),
-- step 39: sightline GL mapping
(39,'Location mapping fix: SNAP > Naples, SSTU > Stewart (corrected during testing)',1),
(39,'Department fix: Sightline POs were mapping to CLIENT NAME (ID 1) instead of Hinckley Services (ID 10)',2),
(39,'Fix implemented by Julian — confirmed working on new bills',3),
(39,'Sightline PO sync: still pending — requires GL mapping fix and sandbox testing',4),
(39,'Peter being asked to automate the Sightline PO file export',5),
(39,'Peter being asked to re-upload the 82,670-record history file',6),
-- step 40: exception management
(40,'Enable Exception Management for Hinckley in NetSuite',1),
(40,'Enable Exception Management portlet on all user dashboards',2),
(40,'Custom NetSuite saved search for GL activity being created by Adina',3),
(40,'Saved search to flag transactions posted to prior periods before the April lock',4),
(40,'Outlook sync connector being investigated by Harrison',5);

-- ── DOCUMENTS ─────────────────────────────────────────────────────────────
INSERT INTO documents (project_id, workflow_id, name, doc_type, is_active) VALUES
(1,1,'VIC.AI Process.docx','Process Doc',1),
(1,1,'VicAI Guidebook 4-26-26.docx','Training',1),
(1,2,'Molo to NetSuite Flow.docx','Process Doc',1),
(1,2,'Service Items.docx','Process Doc',1),
(1,2,'Hinckley Yacht Workflow Updated 2-25-26.docx','Process Doc',1),
(1,3,'NetSuite_Purchasing_4-26-26.docx','Training',1),
(1,3,'MOLO Purchasing Process 4-26-26.docx','Process Doc',1),
(1,4,'Concur & Paylocity.docx','Process Doc',1),
(1,4,'Creating New Employee.docx','SOP',1),
(1,5,'Intercompany_Revenue_Summary.docx','Process Doc',1),
(1,5,'Production Allocation Process.docx','Process Doc',1),
(1,6,'NetSuite Enabled Features and General Preferences.docx','SOP',1),
(1,6,'NetSuite Tips and Tricks.docx','Training',1);

-- ── MEETINGS ──────────────────────────────────────────────────────────────
INSERT INTO meetings (id, project_id, slug, meeting_date, display_date, title, meeting_type, next_meeting, is_published) VALUES
(1,1,'may12','2026-05-12','May 12, 2026','Weekly Sync — Post Go-Live','Weekly Sync','Tuesday May 19, 2026',1),
(2,1,'may12b','2026-05-12','May 12, 2026','Post Go-Live Vic.AI Review & Cleanup Plan','Review','Tuesday May 19, 2026',1),
(3,1,'financial_cutover','2026-05-12','May 12, 2026','Trial Balances Review — Historical Data Load & Cutover Strategy','Review','TBD',1),
(4,1,'may14_purchasing','2026-05-14','May 14, 2026','Weekly Sync — Hinckley Purchasing','Weekly Sync','TBD',1);

-- ── MEETING ATTENDEES ─────────────────────────────────────────────────────
INSERT INTO meeting_attendees (meeting_id, person_id, attendee_name, sort_order) VALUES
(1,1,'Adina',1),(1,12,'Brian',2),(1,6,'Nicole',3),(1,3,'Jenna',4),(1,2,'Gretchen',5),(1,5,'Stephanie',6),(1,14,'Lou',7),
(2,1,'Adina',1),(2,12,'Brian',2),(2,6,'Nicole',3),(2,3,'Jenna',4),(2,2,'Gretchen',5),(2,5,'Stephanie',6),(2,14,'Lou',7),
(3,1,'Adina',1),(3,2,'Gretchen',2),(3,13,'Harrison',3),(3,14,'Lou',4),
(4,1,'Adina',1),(4,15,'Steven',2),(4,13,'Harrison',3),(4,16,'Chad',4),(4,7,'Cheri',5),(4,17,'Justin',6),(4,18,'Tracy',7);

-- ── MEETING TOPICS ────────────────────────────────────────────────────────
INSERT INTO meeting_topics (id, meeting_id, workflow_id, area, color, sort_order) VALUES
-- may12
(1,1,5,'Financial Close — Trial Balance Import Status','#14B8A6',1),
(2,1,1,'Vic.AI / AP','#F59E0B',2),
-- may12b
(3,2,1,'Vic.AI System Performance','#F59E0B',1),
(4,2,1,'Vic.AI Payment Processing','#F59E0B',2),
(5,2,1,'GL Coding Errors & Cleanup Plan','#F59E0B',3),
(6,2,5,'Use Tax Accrual Process','#14B8A6',4),
-- financial_cutover
(7,3,5,'Historical Data Load Status','#14B8A6',1),
(8,3,5,'Cutover Accounting Strategy','#14B8A6',2),
(9,3,5,'Budget Mapping','#14B8A6',3),
(10,3,5,'Margin Report & Cost of Sales Adjustments (CSAs)','#14B8A6',4),
-- may14_purchasing
(11,4,2,'MOLO ↔ NetSuite Integration Bugs','#22C55E',1),
(12,4,3,'Margin Reporting & UOM Standardization','#3B82F6',2),
(13,4,2,'Future Sites — Inventory Load','#22C55E',3);

-- ── MEETING NOTES ─────────────────────────────────────────────────────────
INSERT INTO meeting_notes (topic_id, note_text, sort_order) VALUES
-- topic 1: financial close trial balance
(1,'2026 — All periods imported (Jan 2025 through March 2026) ✅',1),
(1,'Jan 2025 — Full Trial Balance imported with all activity ✅',2),
(1,'Feb 2025 onwards — Subsequent months imported as GL Deltas ✅',3),
(1,'Net Income / EBITDA — Confirmed matching between NetSuite and source systems ✅',4),
(1,'March Month-End — Confirmed matches Sightline month-end ✅',5),
-- topic 2: vic.ai ap
(2,'Screen glitch NOT resolved — Aftab says fix expected week of May 17th',1),
(2,'Workaround: process max 3 invoices at a time to avoid spinning',2),
(2,'Nicole reporting separate issue: screen blanks out even when scrolling — not just batch processing',3),
(2,'Nicole screens going back to top on every refresh — cannot scroll through 70+ invoice list',4),
(2,'Payments: check batch delay due to Vic.ai 3rd-party vendor issue — Lou confirmed Sightline was fully paid before cutover',5),
(2,'Subcontractor payments flagged as biggest concern by Lou',6),
(2,'Vendor ACH campaign sent to ~4,200 vendors — ~20 already signed up',7),
(2,'GL / AI Training: still not learning correctly — wrong GLs posting (e.g. accumulated depreciation, freight revenue, sales discounts)',8),
(2,'Root cause: Bianca does not have access to see expense lines on PO-based invoices',9),
(2,'AI expected to reach ~96% accuracy in 30-60-90 days — team must manually review in the meantime',10),
(2,'Allison (temp starting May 18) to clean up historical GL coding — start with large dollar items first',11),
(2,'Sales tax payable posting process confirmed as correct — not a priority to fix now',12),
-- topic 3: vic.ai system performance
(3,'Widespread system instability — screen freezes, resets, inability to scroll invoice lists',1),
(3,'Root cause: Vic infrastructure overloaded, likely triggered by our large account volume',2),
(3,'Workaround: Process invoices in batches of 3 or fewer until fix is deployed',3),
(3,'Aftab promises infrastructure upgrade will fix the issue by next week',4),
(3,'Nicole & Josh experiencing separate blank-screen issue even when processing 1 invoice at a time',5),
(3,'Adina to email Aftab separately about Nicole blank-screen/scroll glitch',6),
-- topic 4: vic.ai payment processing
(4,'System-wide issue with Vic third-party check vendor — funds debited from our account but checks not being sent',1),
(4,'Canned response in use for vendor inquiries',2),
(4,'ACH enrollment campaign sent to 4,200 vendors — ~20 already signed up',3),
(4,'Lou confirmed everything in Sightline was paid before cutover so delays are within normal terms',4),
(4,'Subcontractor payments flagged as highest priority by Lou',5),
(4,'Priority: fix check issue before building new features like the VicPay dashboard',6),
-- topic 5: GL coding errors
(5,'Vic AI miscoding invoices — items posting to wrong GLs (e.g. freight to Accumulated Depreciation) and wrong locations',1),
(5,'AP workflow gap: Bianca lacked access to expense line subtab — could not see or correct AI-generated GL codes',2),
(5,'Nicole & Josh spent ~16 hours manually cleaning up GL coding errors',3),
(5,'New AP workflow: Bianca handles direct/standalone invoices; Leslie & Tracy handle all PO-based invoices; Production bills require Nicole/Josh final approval',4),
(5,'Bianca granted access to expense line subtab in Vic',5),
(5,'AI expected to reach ~96% accuracy in 30-60-90 days',6),
(5,'Hard-coded rules in Vic.ai NOT supported — would break AI learning and GL sync',7),
(5,'Allison (temp starting May 18) assigned to clean up historical coding errors via VicAI Bills — start with high-value items',8),
(5,'Adina to add Reviewed checkbox to VicAI Bills search for tracking progress',9),
-- topic 6: use tax
(6,'Process of grossing up consumable costs to accrue use tax reviewed',1),
(6,'Finding: long-standing, compliant process — not a new error introduced by Vic.ai',2),
(6,'Decision: Do not change this process now — revisit in June once system is stable',3),
-- topic 7: historical data load
(7,'Net-change method used for historical data (Jan 2025-Mar 2026) — imports monthly GL activity against 1/1/25 opening balance',1),
(7,'Net-change method avoids reversal entries — key improvement over previous load attempt',2),
(7,'2024 and 2025 journal entries created to consolidate Alden financials',3),
(7,'March 2026 Balance Sheet: ties to native NetSuite report with minor variances from mapping (e.g. short-term lease liability)',4),
(7,'March 2026 Income Statement: ~$20k variance vs. official $2,067,990 Net Income — Gretchen exporting to Excel for line-by-line comparison',5),
(7,'Storage COGS is a top-side adjustment in Sightline — historical JEs needed to reclass from Service COGS',6),
-- topic 8: cutover accounting
(8,'Open AP Balance ($2.5M): must be paid outside NetSuite — posting directly to AP account would corrupt AP aging report',1),
(8,'Solution: Use dummy vendor Sightline Vendor #2882 — import balance as a bill, apply future payments as credits until balance zeroes out',2),
(8,'April 2026 Load: Import full April trial balance from Sightline using clearing accounts',3),
(8,'AR: Map $365k balance to Opening Balance AR clearing account',4),
(8,'Inventory: Map $1.497M balance to Opening Balance Inventory clearing account',5),
(8,'Deferred Revenue: Map to Opening Balance Deferred Revenue clearing account',6),
(8,'Goal: MOLO historical data isolated from main GL accounts which are populated cleanly by the April load',7),
-- topic 9: budget mapping
(9,'Imported budget significantly off — missing key items including interest expense',1),
(9,'RSL9 mapping needs correction — Gretchen working with Lou to fix hidden interest/EBITDA budget tabs',2),
-- topic 10: margin report / CSAs
(10,'Margin report confirmed reliable — estimated unit cost is actual average cost at time of transaction',1),
(10,'CSAs correct COGS when inventory costs change retroactively (backdated receipts, price corrections)',2),
(10,'High CSA volume indicates process issues (e.g. negative inventory) and creates variance between margin report and P&L',3),
(10,'Harrison to create a saved search to monitor CSAs and alert team',4),
-- topic 11: MOLO integration bugs
(11,'Purchase Price not syncing from NetSuite to MOLO — ~2,900 items affected since go-live',1),
(11,'Service managers cannot see true costs on work orders, blocking margin management in MOLO',2),
(11,'Bug regression — feature was tested and confirmed working previously',3),
(11,'MOLO Sublet vendor search is unusable — only loads vendors as user scrolls, preventing search until full list loads',4),
(11,'MOLO inventory overstated — system user force-matching to NetSuite without accounting for WIP, causing WIP double-counting',5),
(11,'True QOH = MOLO QOH − MOLO WIP (current workaround until fixed)',6),
(11,'Other unresolved bugs: LOA charge method, WO type tags (partial), WIP amount sync, no date stamps on MOLO transactions',7),
-- topic 12: margin reporting & UOM
(12,'Current margin report unreliable — zero-price transactions from internals, flat-rate jobs, warranty, and packages distort margins',1),
(12,'Live example: WO 227569 showed $700 loss on paint — service manager manually adjusted sales price below cost (sold Pettit Trinidad Pro Blue for $72 each vs $314 cost)',2),
(12,'Solution: filter report by MOLO Job Type = Retail to exclude internal/warranty/rework/package/flat-rate transactions',3),
(12,'UOM problem: inconsistent units across sites (sandpaper by sheet vs. by box) creates incorrect costing and margins',4),
(12,'Justin sells sandpaper by 0.25/0.5/box; Cheri sells sandpaper by the sheet (100 per roll)',5),
(12,'Decision: standardize all items to the smallest unit of measure ever issued at any site',6),
(12,'Use native NetSuite Order Multiple field to display conversion rate on POs (e.g., box of 100 = order multiple of 100)',7),
(12,'Avoid custom pack conversion field — Order Multiple is the proper native field and aligns with future MRP/buyer''s workbench',8),
(12,'Service managers should NOT be able to adjust sales prices on work orders — needs to be locked to certain individuals',9),
(12,'Average cost is location-based in NetSuite (good for site-level margin tracking) — top-level average cost across all locations is meaningless',10),
-- topic 13: future sites inventory load
(13,'Inventory migration plan: export valuation from SightLine → import new items to NetSuite → import inventory quantities + costs via NetSuite inventory adjustment → recreate ~5 open POs manually → ensure all SightLine WIP is closed before migration',1);

-- ── MEETING ACTION ITEMS ──────────────────────────────────────────────────
INSERT INTO meeting_action_items (topic_id, action_text, assignee_name, status, sort_order) VALUES
-- topic 1
(1,'Continue monthly GL Delta imports going forward',NULL,'Open',1),
(1,'Maintain period locks to prevent backdating',NULL,'Open',2),
-- topic 2
(2,'Email Aftab re: Nicole blank-screen/scroll glitch — cc team','Adina','Open',1),
(2,'Check status of last week VicPay check batch','Stephanie','Open',2),
(2,'Give Bianca access to see expense lines on invoices','Stephanie','Open',3),
(2,'Implement AP split: Leslie/Tracy do PO-based invoices; Bianca does standalone directs',NULL,'Open',4),
(2,'Production invoices: AP reviews but does NOT post — forward to Nicole/Josh for approval',NULL,'Open',5),
(2,'Assign Allison to clean up historical GL coding via VicAI Bills — start with large items','Lou/Stephanie','Open',6),
(2,'Update VicAI Bills saved search: add Reference PO, line description, Division','Adina','Open',7),
(2,'Add Reviewed checkbox to VicAI Bills for AP tracking','Adina','Open',8),
-- topic 3
(3,'Email Aftab re: Nicole blank-screen/scroll glitch — cc team','Adina','Open',1),
(3,'Continue 3-invoice-max workaround until infrastructure fix confirmed',NULL,'Open',2),
-- topic 4
(4,'Check status of last week VicPay check batch','Stephanie','Open',1),
(4,'Continue ACH enrollment push — encourage all vendors to switch',NULL,'Open',2),
-- topic 5
(5,'Grant Bianca access to expense line subtab in Vic','Stephanie','Open',1),
(5,'Implement new AP split immediately','Stephanie','Open',2),
(5,'Assign Allison to clean up historical GL coding via VicAI Bills — start with large items','Lou/Stephanie','Open',3),
(5,'Add Reviewed checkbox to VicAI Bills search','Adina','Open',4),
(5,'Update VicAI Bills search: add Reference PO, line description, Division; remove Internal ID','Adina','Open',5),
(5,'Share Claude-generated project dashboard with team','Adina','Open',6),
-- topic 6
(6,'Revisit use tax accrual process in June once system is stable','Gretchen/Nicole','Open',1),
-- topic 7
(7,'Export March 2026 financials to Excel for line-by-line comparison — find ~$20k Net Income variance','Gretchen','Open',1),
(7,'Create historical JEs to reclass Storage COGS from Service COGS','Gretchen','Open',2),
-- topic 8
(8,'Import April 2026 Sightline trial balance — map AR, Inventory, Deferred Revenue to clearing accounts','Gretchen','Open',1),
(8,'Investigate and resolve AP opening-balance clearing account balance','Gretchen','Open',2),
(8,'Create report showing Opening Balance AR, Inventory, Deferred Revenue balances by location — share with Gretchen and Adina','Harrison','Open',3),
-- topic 9
(9,'Email Lou re: hidden interest/EBITDA budget tabs then update budget import','Gretchen','Open',1),
-- topic 10
(10,'Create NetSuite saved search and alert for Cost of Sales Adjustments — send link to Adina and Gretchen','Harrison','Open',1),
(10,'Set up May import for Jenna then guide her on May GL import','Gretchen','Open',2),
-- topic 11
(11,'Email Patrick (MOLO) with consolidated bug list: purchase price sync, sublet search, LOA, WIP, date stamps, WO job types','Adina','Open',1),
(11,'Investigate NetSuite inventory bump for item 15422781 on May 4 8:21 AM — report findings','Harrison','Open',2),
(11,'Continue documenting bugs with screenshots and sending to Adina/Harrison','All purchasers','Open',3),
-- topic 12
(12,'Update margin report — invoice-level detail; filter Retail; exclude Internal; add WO job type column; email to team','Harrison','Open',1),
(12,'Lead UOM standardization project — convert items to smallest issued unit, populate Order Multiple field','Steven & Chad','Open',2),
(12,'Get Brian/Jenna/Andrew alignment on company-wide UOM direction before rolling out to purchasers','Adina','Open',3),
-- topic 13
(13,'Email Peter Bratzis (IT) re: SightLine valuation report — confirm whether it includes WIP and confirm cutover approach','Steven','Open',1),
(13,'Confirm with SightLine that all open work orders/WIP will be closed before migration','Steven','Open',2);
