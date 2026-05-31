import { useEffect, useState } from 'react'

let toastId = 0
const listeners = new Set()

export function showToast(message, type = 'success', duration = 4000) {
  const id = ++toastId
  const toast = { id, message, type }
  listeners.forEach(fn => fn(toast))
  if (duration > 0) {
    setTimeout(() => {
      listeners.forEach(fn => fn({ id, remove: true }))
    }, duration)
  }
  return id
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const listener = (toast) => {
      if (toast.remove) {
        setToasts(prev => prev.filter(t => t.id !== toast.id))
      } else {
        setToasts(prev => [...prev, toast])
      }
    }
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 2000,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            background: t.type === 'error' ? '#3f1f1f' : 'var(--surface)',
            border: `1px solid ${t.type === 'error' ? '#ef4444' : 'var(--accent)'}`,
            color: t.type === 'error' ? '#fca5a5' : 'var(--text)',
            padding: '10px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: 13, maxWidth: 320, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <span>{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
