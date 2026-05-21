import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useProject } from './ProjectContext'

const DEFAULTS = {
  task_status:   [
    { value: 'Not Started', color: '#94A3B8', sort_order: 0 },
    { value: 'In Progress', color: '#3B82F6', sort_order: 1 },
    { value: 'Done',        color: '#16A34A', sort_order: 2, is_system: 1 },
  ],
  task_priority: [
    { value: 'High',   color: '#DC2626', sort_order: 0 },
    { value: 'Medium', color: '#D97706', sort_order: 1 },
    { value: 'Low',    color: '#16A34A', sort_order: 2 },
  ],
  org_type: [
    { value: 'Client', sort_order: 0 }, { value: 'Partner', sort_order: 1 },
    { value: 'Vendor', sort_order: 2 }, { value: 'Internal', sort_order: 3 },
  ],
  doc_type: [
    { value: 'Process Doc', sort_order: 0 }, { value: 'Training', sort_order: 1 },
    { value: 'SOP', sort_order: 2 },         { value: 'Reference', sort_order: 3 },
    { value: 'Template', sort_order: 4 },    { value: 'Other', sort_order: 5 },
  ],
  action_status: [
    { value: 'Open',        color: '#3B82F6', sort_order: 0, is_system: 1 },
    { value: 'In Progress', color: '#D97706', sort_order: 1 },
    { value: 'Closed',      color: '#16A34A', sort_order: 2 },
    { value: 'On Hold',     color: '#94A3B8', sort_order: 3 },
  ],
  topic_color: [
    { value: '#3B82F6', sort_order: 0 }, { value: '#22C55E', sort_order: 1 },
    { value: '#F59E0B', sort_order: 2 }, { value: '#A855F7', sort_order: 3 },
    { value: '#14B8A6', sort_order: 4 }, { value: '#EF4444', sort_order: 5 },
    { value: '#6366F1', sort_order: 6 }, { value: '#64748B', sort_order: 7 },
  ],
}

const ConfigContext = createContext({
  config: null,
  getValues: cat => DEFAULTS[cat] || [],
  getOptions: cat => (DEFAULTS[cat] || []).map(i => i.value),
  getColor: () => null,
  reload: () => {},
})

export function useConfig() { return useContext(ConfigContext) }

export function ConfigProvider({ children }) {
  const { slug, authFetch } = useProject()
  const [config, setConfig] = useState(null)

  const reload = useCallback(() => {
    if (!slug || !authFetch) return
    authFetch(`/api/config?slug=${slug}`)
      .then(r => r.json())
      .then(setConfig)
      .catch(() => {})
  }, [slug, authFetch])

  useEffect(() => { reload() }, [reload])

  const getValues = (category) => {
    const src = config && config[category] ? config[category] : DEFAULTS[category] || []
    return src
      .filter(item => item.is_active !== 0)
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }

  const getOptions = (category) => getValues(category).map(item => item.value)

  const getColor = (category, value) =>
    getValues(category).find(item => item.value === value)?.color || null

  return (
    <ConfigContext.Provider value={{ config, getValues, getOptions, getColor, reload }}>
      {children}
    </ConfigContext.Provider>
  )
}
