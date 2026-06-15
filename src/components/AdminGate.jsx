import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { amIAdmin } from '../utils/formStorage'

// Wraps admin pages (inside ProtectedRoute, so a session already exists) and
// enforces the admin allowlist. In bootstrap mode (no active admin configured
// yet) everyone signed in is allowed, so this can never lock out the owner.
export default function AdminGate({ children }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [state, setState] = useState('checking') // 'checking' | 'ok' | 'denied' | 'error'

  useEffect(() => {
    let cancelled = false
    amIAdmin()
      .then(r => { if (!cancelled) setState(r?.isAdmin ? 'ok' : 'denied') })
      .catch(() => { if (!cancelled) setState('error') })
    return () => { cancelled = true }
  }, [])

  if (state === 'checking') {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(201,168,76,0.2)', borderTopColor: '#C9A84C', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (state === 'denied') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f0a1a,#1e0f3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🔒</div>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>Admin access only</h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
            This account isn't an administrator. Ask an existing admin to invite you, then sign in again.
          </p>
          <button onClick={async () => { await signOut(); navigate('/login', { replace: true }) }}
            style={{ background: 'linear-gradient(135deg,#6c3fc5,#9333ea)', border: 'none', borderRadius: 10, color: '#fff', padding: '12px 26px', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // On an error (e.g. network/DB hiccup) fail open to the existing session check —
  // the server still enforces the allowlist on every admin write regardless.
  return children
}
