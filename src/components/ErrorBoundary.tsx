import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
}

/**
 * App-level error boundary. Without it, any uncaught render error unmounts the
 * whole React tree and leaves a blank white screen. This catches it and shows a
 * recoverable fallback instead.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: 40, textAlign: 'center', color: 'var(--text)',
          background: 'var(--bg)', fontFamily: 'inherit',
        }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: 'var(--text-dim)', maxWidth: 460 }}>
            The page hit an unexpected error. Reloading usually fixes it. If it keeps
            happening, let the team know.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8, padding: '8px 18px', borderRadius: 8, border: 'none',
              background: 'var(--accent)', color: 'var(--accent-text)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
