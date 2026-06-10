import { requireProjectAccess } from '../lib/authz'
import { parsePagination } from '../lib/pagination'
import type { Ctx } from '../lib/types'
import type { WorkflowRow, WorkflowStepRow, DocumentRow } from '../../shared/types'

interface StepWithDetail extends WorkflowStepRow {
  summary: string | null
  detail_id: number | null
}

interface PointRow {
  step_detail_id: number
  workflow_step_id: number
  point_text: string
  sort_order: number
}

interface OwnerRow {
  id: number
  workflow_id: number
  person_id: number | null
  sort_order: number
  avatar_bg: string | null
  avatar_fg: string | null
  [key: string]: unknown
}

export async function onRequestGet({ env, request }: Ctx): Promise<Response> {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') ?? undefined;

  const access = await requireProjectAccess(request, env, { slug });
  if (access instanceof Response) return access;

  const projectId = access.projectInfo.projectId;

  const { limit, offset } = parsePagination(url);

  const { results: workflows } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM workflows WHERE project_id = ? AND is_active = 1 ORDER BY sort_order ASC LIMIT ? OFFSET ?
  `).bind(projectId, limit, offset).all<WorkflowRow>();

  const { results: steps } = await env.ddsr_dashboard.prepare(`
    SELECT ws.*, wsd.summary, wsd.id as detail_id
    FROM workflow_steps ws
    LEFT JOIN workflow_step_details wsd ON wsd.workflow_step_id = ws.id
    WHERE ws.workflow_id IN (SELECT id FROM workflows WHERE project_id = ?)
    ORDER BY ws.workflow_id, ws.sort_order
  `).bind(projectId).all<StepWithDetail>();

  const { results: points } = await env.ddsr_dashboard.prepare(`
    SELECT wsdp.*, wsd.workflow_step_id
    FROM workflow_step_detail_points wsdp
    JOIN workflow_step_details wsd ON wsdp.step_detail_id = wsd.id
    JOIN workflow_steps ws ON wsd.workflow_step_id = ws.id
    JOIN workflows w ON ws.workflow_id = w.id
    WHERE w.project_id = ?
    ORDER BY wsdp.step_detail_id, wsdp.sort_order
  `).bind(projectId).all<PointRow>();

  const { results: owners } = await env.ddsr_dashboard.prepare(`
    SELECT wo.*, p.avatar_bg, p.avatar_fg
    FROM workflow_owners wo
    LEFT JOIN people p ON wo.person_id = p.id
    WHERE wo.workflow_id IN (SELECT id FROM workflows WHERE project_id = ?)
    ORDER BY wo.workflow_id, wo.sort_order
  `).bind(projectId).all<OwnerRow>();

  const { results: docs } = await env.ddsr_dashboard.prepare(`
    SELECT * FROM documents WHERE project_id = ? AND is_active = 1 ORDER BY workflow_id, id
  `).bind(projectId).all<DocumentRow>();

  // Attach steps, points, owners, docs to each workflow
  const pointsByDetailId = points.reduce<Record<number, string[]>>((acc, p) => {
    if (!acc[p.step_detail_id]) acc[p.step_detail_id] = [];
    acc[p.step_detail_id].push(p.point_text);
    return acc;
  }, {});

  const stepsWithPoints = steps.map(s => ({
    ...s,
    points: s.detail_id ? (pointsByDetailId[s.detail_id] || []) : [],
  }));

  const data = workflows.map(w => ({
    ...w,
    steps:  stepsWithPoints.filter(s => s.workflow_id === w.id),
    owners: owners.filter(o => o.workflow_id === w.id),
    docs:   docs.filter(d => d.workflow_id === w.id),
  }));

  return Response.json(data);
}
