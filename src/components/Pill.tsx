import { STATUS_BG, STATUS_COL, STATUS_DOT, PRI_BG, PRI_COL } from '../data/constants'

interface StatusPillProps {
  status: string
  color?: string | null
}

export function StatusPill({ status, color }: StatusPillProps) {
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

interface CategoryPillProps {
  name?: string | null
  color?: string | null
}

export function CategoryPill({ name, color }: CategoryPillProps) {
  const c = color || '#64748B'
  return (
    <span className="pill" style={{ background: c + '22', color: c }}>
      {name}
    </span>
  )
}

interface PriorityPillProps {
  priority?: string | null
  color?: string
}

export function PriorityPill({ priority, color }: PriorityPillProps) {
  if (!priority) return null
  const bg  = color ? color + '20' : (PRI_BG[priority]  || '#F1F5F9')
  const col = color ? color        : (PRI_COL[priority] || '#64748B')
  return (
    <span className="pill" style={{ background: bg, color: col }}>
      {priority}
    </span>
  )
}
