import { STATUS_BG, STATUS_COL, STATUS_DOT, PRI_BG, PRI_COL } from '../data/constants'

export function StatusPill({ status }) {
  return (
    <span className="pill" style={{ background: STATUS_BG[status] || '#F1F5F9', color: STATUS_COL[status] || '#64748B' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[status] || '#CBD5E1', display: 'inline-block' }} />
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

export function PriorityPill({ priority }) {
  if (!priority) return null
  return (
    <span className="pill" style={{ background: PRI_BG[priority], color: PRI_COL[priority] }}>
      {priority}
    </span>
  )
}
