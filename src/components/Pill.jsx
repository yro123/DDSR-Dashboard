import { STATUS_BG, STATUS_COL, STATUS_DOT, PRI_BG, PRI_COL } from '../data/constants'

export function StatusPill({ status, color }) {
  const bg  = color ? color + '20' : (STATUS_BG[status]  || '#F1F5F9')
  const col = color ? color        : (STATUS_COL[status] || '#64748B')
  const dot = color ? color        : (STATUS_DOT[status] || '#CBD5E1')
  return (
    <span className="pill" style={{ background: bg, color: col }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
      {status}
    </span>
  )
}

export function CategoryPill({ name, color }) {
  return (
    <span className="pill" style={{ background: color + '22', color }}>
      {name}
    </span>
  )
}

export function PriorityPill({ priority, color }) {
  if (!priority) return null
  const bg  = color ? color + '20' : (PRI_BG[priority]  || '#F1F5F9')
  const col = color ? color        : (PRI_COL[priority] || '#64748B')
  return (
    <span className="pill" style={{ background: bg, color: col }}>
      {priority}
    </span>
  )
}
