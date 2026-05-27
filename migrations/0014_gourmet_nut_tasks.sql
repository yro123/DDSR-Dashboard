-- Gourmet Nut: 11 additional tasks (May 2026)
-- reporting: 7 report-related tasks (sort 7–13)
-- finance-accounting: 4 finance/accounting tasks (sort 29–32)

-- reporting
INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Follow up on PO2 Report', 'Not Started', 'Normal', 7, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'AP2 Report – look at total number – doesn''t seem to add up', 'Not Started', 'Normal', 8, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'ADTP Report – consolidate with AR 9', 'Not Started', 'Normal', 9, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'AR8 – confirm it''s the next 7 days', 'Not Started', 'Normal', 10, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Open PO Report – looks wrong', 'Not Started', 'Normal', 11, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Fix up rest of the links on the report tab – numbering and ordering', 'Not Started', 'Normal', 12, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Comp Report with Q1 2025 and with Q4 2025', 'Not Started', 'Normal', 13, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='reporting' AND w.project_id=p.id;

-- finance-accounting
INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Costing Method Write up and Decision', 'Not Started', 'Normal', 29, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Q1 2026 – Next Task', 'Not Started', 'Normal', 30, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'AP Team – Further Analyze Bills', 'Not Started', 'Normal', 31, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;

INSERT INTO tasks (project_id, workflow_id, title, status, priority, sort_order, is_archived)
  SELECT p.id, w.id, 'Accrual Accounts – true up each one', 'Not Started', 'Normal', 32, 0
  FROM projects p, workflows w
  WHERE p.slug='gourmet-nut' AND w.slug='finance-accounting' AND w.project_id=p.id;
