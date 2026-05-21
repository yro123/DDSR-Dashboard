import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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

export default function Invite() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const token     = params.get('token')

  const { data: session, isPending } = authClient.useSession()

  const [invite, setInvite]   = useState(null)
  const [invErr, setInvErr]   = useState('')
  const [mode, setMode]       = useState('password')
  const [isSignUp, setIsSignUp] = useState(true)
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)

  // Persist token in sessionStorage so it survives OAuth redirects
  useEffect(() => {
    if (token) sessionStorage.setItem('pendingInviteToken', token)
  }, [token])

  // Load invite info
  useEffect(() => {
    const t = token || sessionStorage.getItem('pendingInviteToken')
    if (!t) { setInvErr('No invite token found.'); return }
    fetch(`/api/invitations/${t}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setInvErr(data.error)
        else { setInvite(data); if (data.email) setEmail(data.email) }
      })
      .catch(() => setInvErr('Could not validate invite.'))
  }, [token])

  // If already signed in, apply the invite automatically
  useEffect(() => {
    if (isPending || !session || !invite) return
    const t = sessionStorage.getItem('pendingInviteToken')
    if (!t) return

    fetch(`/api/invitations/${t}`, { method: 'POST', credentials: 'include' })
      .then(() => {
        sessionStorage.removeItem('pendingInviteToken')
        // Force session refresh then navigate
        authClient.getSession({ fetchOptions: { cache: 'no-store' } })
          .then(() => navigate(`/${invite.clientSlug}/tasks`, { replace: true }))
      })
      .catch(() => navigate('/', { replace: true }))
  }, [session, isPending, invite])

  const applyAndRedirect = async () => {
    const t = sessionStorage.getItem('pendingInviteToken')
    if (t && invite) {
      try {
        await fetch(`/api/invitations/${t}`, { method: 'POST', credentials: 'include' })
        sessionStorage.removeItem('pendingInviteToken')
      } catch {}
    }
    navigate(invite ? `/${invite.clientSlug}/tasks` : '/', { replace: true })
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
      await applyAndRedirect()
    } catch (err) {
      setError(err?.message || 'Something went wrong.')
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
      setError(err?.message || 'Failed to send link.')
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

  if (invErr) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <div style={{ textAlign: 'center', color: '#D4D4D8' }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>🔗</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Invalid Invite</div>
          <div style={{ fontSize: 13, color: '#71717A' }}>{invErr}</div>
        </div>
      </div>
    )
  }

  if (!invite || isPending) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
        <div style={{ color: '#71717A', fontSize: 13 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111111' }}>
      <div style={{
        width: 380, background: '#1A1A1A',
        border: '1px solid #2D2D2D', borderRadius: 14,
        boxShadow: '0 25px 50px rgba(0,0,0,.6)',
        padding: '32px 32px 28px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/ddsr-logo.png" alt="DDSR" style={{ height: 40, marginBottom: 10 }}
            onError={e => { e.target.style.display = 'none' }} />
          <div style={{ fontSize: 18, fontWeight: 800, color: '#D4D4D8' }}>You're invited!</div>
          <div style={{ fontSize: 13, color: '#71717A', marginTop: 6 }}>
            Join the <strong style={{ color: accent }}>{invite.clientSlug}</strong> workspace on DDSR Dashboard
          </div>
        </div>

        <div style={{ display: 'flex', background: '#111', borderRadius: 7, padding: 3, marginBottom: 18 }}>
          {tabBtn('Sign up', mode === 'password' && isSignUp, () => { setMode('password'); setIsSignUp(true); setError('') })}
          {tabBtn('Sign in', mode === 'password' && !isSignUp, () => { setMode('password'); setIsSignUp(false); setError('') })}
          {tabBtn('Magic Link', mode === 'magic', () => { setMode('magic'); setError('') })}
        </div>

        {mode === 'password' && (
          <form onSubmit={handlePassword}>
            {isSignUp && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} autoFocus />
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
            </div>
            {error && <div style={{ fontSize: 12, color: '#EF4444', marginBottom: 12 }}>{error}</div>}
            <button type="submit" style={btnPrimary} disabled={busy}>
              {busy ? '…' : isSignUp ? 'Create account & join' : 'Sign in & join'}
            </button>
          </form>
        )}

        {mode === 'magic' && !sent && (
          <form onSubmit={handleMagicLink}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} autoFocus />
            </div>
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
          </div>
        )}
      </div>
    </div>
  )
}
