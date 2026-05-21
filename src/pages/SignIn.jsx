import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authClient } from '../lib/auth-client'

const accent = '#00D4C8'

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #2D2D2D', background: '#242424',
  color: '#D4D4D8', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle = {
  fontSize: 11, fontWeight: 600, color: '#71717A',
  textTransform: 'uppercase', letterSpacing: '.05em',
  display: 'block', marginBottom: 5,
}
const btnPrimary = {
  width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
  background: accent, color: '#0A0A0A', fontWeight: 700, fontSize: 14,
  fontFamily: 'inherit', cursor: 'pointer',
}

function Field({ label, type = 'text', value, onChange, placeholder, autoFocus }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={inputStyle}
      />
    </div>
  )
}

export default function SignIn() {
  const navigate = useNavigate()
  const [mode, setMode]       = useState('password') // 'password' | 'magic'
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  const applyPendingInvite = async () => {
    const token = sessionStorage.getItem('pendingInviteToken')
    if (!token) return
    try {
      await fetch(`/api/invitations/${token}`, { method: 'POST', credentials: 'include' })
      sessionStorage.removeItem('pendingInviteToken')
    } catch {}
  }

  const afterAuth = async () => {
    await applyPendingInvite()
    navigate('/', { replace: true })
  }

  const handlePassword = async e => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      if (isSignUp) {
        const { error: err } = await authClient.signUp.email({ email, password, name })
        if (err) throw err
      } else {
        const { error: err } = await authClient.signIn.email({ email, password })
        if (err) throw err
      }
      await afterAuth()
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  const handleMagicLink = async e => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const { error: err } = await authClient.signIn.magicLink({ email })
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err?.message || 'Failed to send link. Try again.')
    }
    setBusy(false)
  }

  const tabBtn = (label, active, onClick) => (
    <button onClick={onClick} style={{
      flex: 1, padding: '7px 0', border: 'none', borderRadius: 6,
      background: active ? '#2A2A2A' : 'transparent',
      color: active ? '#D4D4D8' : '#71717A',
      fontWeight: 600, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
    }}>{label}</button>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#111111',
    }}>
      <div style={{
        width: 380, background: '#1A1A1A',
        border: '1px solid #2D2D2D', borderRadius: 14,
        boxShadow: '0 25px 50px rgba(0,0,0,.6)',
        padding: '32px 32px 28px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/ddsr-logo.png" alt="DDSR" style={{ height: 40, marginBottom: 10 }}
            onError={e => { e.target.style.display = 'none' }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: '#D4D4D8', letterSpacing: '-.01em' }}>
            DDSR Dashboard
          </div>
          <div style={{ fontSize: 12, color: '#71717A', marginTop: 4 }}>
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </div>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', background: '#111', borderRadius: 7, padding: 3, marginBottom: 18 }}>
          {tabBtn('Password', mode === 'password', () => { setMode('password'); setError(''); setSent(false) })}
          {tabBtn('Magic Link', mode === 'magic', () => { setMode('magic'); setError(''); setSent(false) })}
        </div>

        {/* Password form */}
        {mode === 'password' && (
          <form onSubmit={handlePassword}>
            {isSignUp && (
              <Field label="Name" value={name} onChange={setName} placeholder="Your name" autoFocus />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus={!isSignUp} />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
            <button type="submit" style={btnPrimary} disabled={busy}>
              {busy ? '…' : isSignUp ? 'Create account' : 'Sign in'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#71717A' }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button type="button" onClick={() => { setIsSignUp(v => !v); setError('') }}
                style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', fontWeight: 600 }}>
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </form>
        )}

        {/* Magic link form */}
        {mode === 'magic' && !sent && (
          <form onSubmit={handleMagicLink}>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
            {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
            <button type="submit" style={btnPrimary} disabled={busy}>
              {busy ? '…' : 'Send sign-in link'}
            </button>
          </form>
        )}

        {mode === 'magic' && sent && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#D4D4D8', marginBottom: 6 }}>Check your email</div>
            <div style={{ fontSize: 12, color: '#71717A' }}>
              We sent a sign-in link to <strong style={{ color: '#A1A1AA' }}>{email}</strong>
            </div>
            <button onClick={() => setSent(false)}
              style={{ marginTop: 14, background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
              Send again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
