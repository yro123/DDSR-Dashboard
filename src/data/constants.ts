export const STATUS_DOT: Record<string, string> = {
  'Not Started': 'var(--status-ns)',
  'In Progress': 'var(--status-ip)',
  'Done':        'var(--status-done)',
}
export const STATUS_BG: Record<string, string> = {
  'Not Started': 'var(--status-ns-bg)',
  'In Progress': 'var(--status-ip-bg)',
  'Done':        'var(--status-done-bg)',
}
export const STATUS_COL: Record<string, string> = {
  'Not Started': 'var(--status-ns-col)',
  'In Progress': 'var(--status-ip-col)',
  'Done':        'var(--status-done-col)',
}
export const PRI_BG: Record<string, string> = {
  High:   'var(--pri-high-bg)',
  Medium: 'var(--pri-med-bg)',
  Low:    'var(--pri-low-bg)',
}
export const PRI_COL: Record<string, string> = {
  High:   'var(--pri-high-col)',
  Medium: 'var(--pri-med-col)',
  Low:    'var(--pri-low-col)',
}
export const STATUSES = ['Not Started', 'In Progress', 'Done'] as const
export const PRIORITIES = ['High', 'Medium', 'Low'] as const
