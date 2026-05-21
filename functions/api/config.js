const CATEGORIES = ['task_status', 'task_priority', 'org_type', 'doc_type', 'action_status', 'topic_color']

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url)
  const slug = url.searchParams.get('slug')
  const globalOnly = url.searchParams.get('global') === '1'

  let projectId = null
  if (slug && !globalOnly) {
    const proj = await env.ddsr_dashboard.prepare(
      'SELECT id FROM projects WHERE slug = ? LIMIT 1'
    ).bind(slug).first()
    if (!proj) return Response.json({ error: 'Project not found' }, { status: 404 })
    projectId = proj.id
  }

  const { results: globalItems } = await env.ddsr_dashboard.prepare(
    `SELECT * FROM app_config WHERE project_id IS NULL ORDER BY category, sort_order`
  ).all()

  let projectItems = []
  if (projectId) {
    const r = await env.ddsr_dashboard.prepare(
      `SELECT * FROM app_config WHERE project_id = ? ORDER BY category, sort_order`
    ).bind(projectId).all()
    projectItems = r.results
  }

  const merged = {}
  const isOverride = {}
  for (const cat of CATEGORIES) {
    const projRows = projectItems.filter(r => r.category === cat)
    if (projRows.length > 0) {
      merged[cat] = projRows
      isOverride[cat] = true
    } else {
      merged[cat] = globalItems.filter(r => r.category === cat)
      isOverride[cat] = false
    }
  }

  // Also expose all global items for the ConfigTab UI
  const globalByCategory = {}
  for (const cat of CATEGORIES) {
    globalByCategory[cat] = globalItems.filter(r => r.category === cat)
  }

  return Response.json({
    ...merged,
    is_project_override: isOverride,
    global: globalByCategory,
    project_id: projectId,
  })
}

export async function onRequestPost({ env, request }) {
  const body = await request.json()
  const { project_id, category, value, color, sort_order } = body

  if (!CATEGORIES.includes(category)) return Response.json({ error: 'Invalid category' }, { status: 400 })
  if (!value?.trim() && category !== 'topic_color') return Response.json({ error: 'value is required' }, { status: 400 })
  if (category === 'topic_color' && !color && !value) return Response.json({ error: 'color is required for topic_color' }, { status: 400 })

  const now = new Date().toISOString()
  const insertValue = category === 'topic_color' ? (color || value) : value.trim()
  const insertColor = category === 'topic_color' ? (color || value) : (color || null)

  try {
    const { meta } = await env.ddsr_dashboard.prepare(`
      INSERT INTO app_config (project_id, category, value, color, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(project_id || null, category, insertValue, insertColor, sort_order ?? 0, now, now).run()

    const item = await env.ddsr_dashboard.prepare(
      'SELECT * FROM app_config WHERE id = ?'
    ).bind(meta.last_row_id).first()
    return Response.json(item, { status: 201 })
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return Response.json({ error: 'Value already exists' }, { status: 409 })
    throw e
  }
}
