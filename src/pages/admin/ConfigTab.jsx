import { useState, useEffect, useCallback } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const CATEGORY_META = [
  { key: 'task_status',   label: 'Task Statuses',         hasColor: true  },
  { key: 'task_priority', label: 'Task Priorities',        hasColor: true  },
  { key: 'org_type',      label: 'People Org Types',       hasColor: false },
  { key: 'doc_type',      label: 'Document Types',         hasColor: false },
  { key: 'action_status', label: 'Action Item Statuses',   hasColor: true  },
  { key: 'topic_color',   label: 'Meeting Topic Colors',   hasColor: true, isColorPalette: true },
]

const btn = {
  base:   { border: 'none', borderRadius: 6, padding: '4px 11px', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' },
  save:   { background: 'var(--accent)', color: 'var(--accent-text)' },
  cancel: { background: 'var(--surface-2)', color: 'var(--text-muted)' },
  danger: { background: '#fee2e2', color: '#b91c1c' },
  ghost:  { background: 'transparent', color: 'var(--accent)', padding: '3px 8px' },
}
const Btn = ({ style, children, ...props }) => (
  <button style={{ ...btn.base, ...style }} {...props}>{children}</button>
)

function ColorSwatch({ color }) {
  return (
    <span style={{
      display: 'inline-block', width: 14, height: 14, borderRadius: 3,
      background: color || '#ccc', border: '1px solid rgba(0,0,0,.12)', flexShrink: 0,
    }} />
  )
}

function SortableItemRow({ item, hasColor, isColorPalette, authFetch, onReload }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ value: item.value, color: item.color || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    await authFetch(`/api/config/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        value: isColorPalette ? (form.color || form.value) : form.value,
        color: form.color || null,
        sort_order: item.sort_order,
        is_active: item.is_active,
      }),
    })
    setEditing(false)
    onReload()
  }

  const remove = async () => {
    if (!confirm(`Delete "${item.value}"?`)) return
    const res = await authFetch(`/api/config/${item.id}`, { method: 'DELETE' })
    if (res.ok) onReload()
    else { const j = await res.json(); alert(j.error || 'Delete failed') }
  }

  const rowStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px',
    borderBottom: '1px solid var(--border)',
    background: isDragging ? 'var(--surface-2)' : 'var(--surface)',
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (editing) {
    return (
      <div ref={setNodeRef} style={rowStyle}>
        {isColorPalette ? (
          <>
            <input type="color" value={form.color || '#000000'} onChange={e => set('color', e.target.value)}
              style={{ width: 32, height: 28, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
            <input value={form.color} onChange={e => set('color', e.target.value)}
              style={{ width: 90, padding: '3px 7px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, fontFamily: 'monospace', background: 'var(--surface)', color: 'var(--text)' }} />
          </>
        ) : (
          <>
            <input value={form.value} onChange={e => set('value', e.target.value)}
              style={{ flex: 1, padding: '3px 7px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }} />
            {hasColor && (
              <>
                <input type="color" value={form.color || '#000000'} onChange={e => set('color', e.target.value)}
                  style={{ width: 30, height: 26, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
                <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="#hex"
                  style={{ width: 80, padding: '3px 7px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, fontFamily: 'monospace', background: 'var(--surface)', color: 'var(--text)' }} />
              </>
            )}
          </>
        )}
        <Btn style={btn.save} onClick={save}>Save</Btn>
        <Btn style={btn.cancel} onClick={() => setEditing(false)}>Cancel</Btn>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={rowStyle}>
      <span {...attributes} {...listeners} title="Drag to reorder" style={{ cursor: 'grab', color: 'var(--text-dim)', fontSize: 15, lineHeight: 1, flexShrink: 0, padding: '0 2px' }}>⠿</span>
      {isColorPalette ? (
        <>
          <ColorSwatch color={item.color || item.value} />
          <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)', flex: 1 }}>{item.value}</span>
        </>
      ) : (
        <>
          {hasColor && <ColorSwatch color={item.color} />}
          <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{item.value}</span>
          {item.is_system ? (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 6px' }}>system</span>
          ) : null}
        </>
      )}
      <div style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
        <Btn style={{ ...btn.base, background: 'var(--surface-2)', color: 'var(--text)', fontSize: 11 }} onClick={() => setEditing(true)}>Edit</Btn>
        {!item.is_system && (
          <Btn style={{ ...btn.base, ...btn.danger, fontSize: 11 }} onClick={remove}>×</Btn>
        )}
      </div>
    </div>
  )
}

function AddItemForm({ category, projectId, hasColor, isColorPalette, authFetch, onReload, nextOrder }) {
  const [form, setForm] = useState({ value: '', color: '#3B82F6' })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!isColorPalette && !form.value.trim()) return
    setBusy(true)
    const payload = {
      project_id: projectId || null,
      category,
      value: isColorPalette ? form.color : form.value.trim(),
      color: (hasColor || isColorPalette) ? form.color : null,
      sort_order: nextOrder,
    }
    const res = await authFetch('/api/config', { method: 'POST', body: JSON.stringify(payload) })
    setBusy(false)
    if (res.ok) { setForm({ value: '', color: '#3B82F6' }); onReload() }
    else { const j = await res.json(); alert(j.error || 'Failed to add') }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--surface-2)', borderTop: '1px solid var(--border)', borderRadius: '0 0 8px 8px' }}>
      {isColorPalette ? (
        <>
          <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
            style={{ width: 32, height: 28, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
          <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="#3B82F6"
            style={{ width: 90, padding: '3px 7px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, fontFamily: 'monospace', background: 'var(--surface)', color: 'var(--text)' }} />
        </>
      ) : (
        <>
          <input value={form.value} onChange={e => set('value', e.target.value)} placeholder="New value…"
            style={{ flex: 1, padding: '4px 8px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, background: 'var(--surface)', color: 'var(--text)' }}
            onKeyDown={e => e.key === 'Enter' && submit()} />
          {hasColor && (
            <>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width: 30, height: 26, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', padding: 1 }} />
              <input value={form.color} onChange={e => set('color', e.target.value)} placeholder="#hex"
                style={{ width: 80, padding: '3px 7px', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, fontFamily: 'monospace', background: 'var(--surface)', color: 'var(--text)' }} />
            </>
          )}
        </>
      )}
      <Btn style={{ ...btn.base, ...btn.save }} onClick={submit} disabled={busy}>+ Add</Btn>
    </div>
  )
}

function CategorySection({ meta, items, globalItems, projectId, isOverride, authFetch, onReload }) {
  const { key, label, hasColor, isColorPalette } = meta
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const sorted = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const oldIdx = sorted.findIndex(i => i.id === active.id)
    const newIdx = sorted.findIndex(i => i.id === over.id)
    const reordered = arrayMove(sorted, oldIdx, newIdx)
    const updates = reordered
      .map((item, idx) => ({ item, newOrder: idx }))
      .filter(({ item, newOrder }) => item.sort_order !== newOrder)
    await Promise.all(updates.map(({ item, newOrder }) =>
      authFetch(`/api/config/${item.id}`, { method: 'PUT', body: JSON.stringify({ sort_order: newOrder }) })
    ))
    onReload()
  }

  const overrideProject = async () => {
    const base = globalItems.length > 0 ? globalItems : items
    for (let i = 0; i < base.length; i++) {
      await authFetch('/api/config', {
        method: 'POST',
        body: JSON.stringify({
          project_id: projectId,
          category: key,
          value: base[i].value,
          color: base[i].color || null,
          sort_order: i,
        }),
      })
    }
    onReload()
  }

  const resetToGlobal = async () => {
    if (!confirm('Remove all project-specific overrides for this category? It will revert to global values.')) return
    for (const item of items) {
      if (!item.is_system) await authFetch(`/api/config/${item.id}`, { method: 'DELETE' })
    }
    onReload()
  }

  const sectionStyle = {
    border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16,
  }
  const headerStyle = {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: 'var(--surface-2)',
    borderBottom: items.length ? '1px solid var(--border)' : 'none',
  }

  const isInheriting = projectId && !isOverride

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{label}</span>
        {projectId ? (
          isInheriting ? (
            <>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>using global defaults</span>
              <Btn style={{ ...btn.base, ...btn.ghost, marginLeft: 'auto' }} onClick={overrideProject}>
                Override for this project
              </Btn>
            </>
          ) : (
            <>
              <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 4 }}>project override</span>
              <Btn style={{ ...btn.base, background: '#fee2e2', color: '#b91c1c', fontSize: 11, marginLeft: 'auto' }} onClick={resetToGlobal}>
                Reset to global ↺
              </Btn>
            </>
          )
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>global</span>
        )}
      </div>

      {isInheriting ? (
        <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
          {globalItems.map(i => i.value).join(' · ')}
        </div>
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map(item => (
                <SortableItemRow
                  key={item.id}
                  item={item}
                  hasColor={hasColor}
                  isColorPalette={isColorPalette}
                  authFetch={authFetch}
                  onReload={onReload}
                />
              ))}
            </SortableContext>
          </DndContext>
          <AddItemForm
            category={key}
            projectId={isOverride ? projectId : null}
            hasColor={hasColor}
            isColorPalette={isColorPalette}
            authFetch={authFetch}
            onReload={onReload}
            nextOrder={items.length}
          />
        </>
      )}
    </div>
  )
}

export default function ConfigTab({ projectSlug, authFetch }) {
  const [scope, setScope] = useState('global')  // 'global' | 'project'
  const [configData, setConfigData] = useState(null)

  const reload = useCallback(() => {
    const url = scope === 'global'
      ? '/api/config?global=1'
      : `/api/config?slug=${projectSlug}`
    authFetch(url).then(r => r.json()).then(setConfigData).catch(() => {})
  }, [scope, projectSlug, authFetch])

  useEffect(() => { reload() }, [reload])

  if (!configData) return <div style={{ padding: 24, color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>

  const projectId = scope === 'project' ? configData.project_id : null
  const globalData = configData.global || {}

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Config</span>
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 7, padding: 3, marginLeft: 8 }}>
          {['global', 'project'].map(s => (
            <button key={s} onClick={() => setScope(s)} style={{
              padding: '4px 14px', borderRadius: 5, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
              background: scope === s ? 'var(--accent)' : 'transparent',
              color: scope === s ? 'var(--accent-text)' : 'var(--text-muted)',
            }}>
              {s === 'global' ? 'Global' : 'This Project'}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
          {scope === 'global'
            ? 'Global defaults are inherited by all projects unless overridden.'
            : 'Per-project overrides replace global values for the selected project only.'}
        </span>
      </div>

      {CATEGORY_META.map(meta => {
        const items = (configData[meta.key] || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        const global = (globalData[meta.key] || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        const isOverride = scope === 'project' && !!(configData.is_project_override?.[meta.key])
        return (
          <CategorySection
            key={meta.key}
            meta={meta}
            items={items}
            globalItems={global}
            projectId={projectId}
            isOverride={isOverride}
            authFetch={authFetch}
            onReload={reload}
          />
        )
      })}
    </div>
  )
}
