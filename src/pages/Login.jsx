import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ACC = '#C9A84C'
const DARK = '#0f0a1a'

export default function Login() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signIn, isCloud } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = (extra = {}) => ({
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid rgba(255,255,255,${error ? '0.08' : '0.14'})`,
    borderRadius: 10, color: 'white',
    fontFamily: "'Montserrat',sans-serif",
    fontSize: 14, padding: '13px 15px',
    outline: 'none',
    ...extra,
  })

  return (
    <div style={{
      minHeight: '100vh', background: DARK,
      fontFamily: "'Montserrat',sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(91,45,142,0.3) 0%, transparent 65%)',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64,
            background: `linear-gradient(135deg, ${ACC}, #e8c060)`,
            borderRadius: 16, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 900, fontSize: 26, color: '#1A1A2E',
            marginBottom: 16,
          }}>IW</div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1, color: 'white' }}>IWC CONCEPTS</div>
          <div style={{ fontSize: 10, color: ACC, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4 }}>Creative Studio Platform</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>Welcome back</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
            {isCloud ? 'Sign in with your Supabase account' : 'Enter the app password to continue'}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email — shown in cloud mode or when no password set */}
            {isCloud && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: ACC, letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
                <input
                  style={inp()}
                  type="email"
                  autoComplete="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: ACC, letterSpacing: 2, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  style={inp({ paddingRight: 60 })}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={isCloud ? 'Enter password' : 'App password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus={!isCloud}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
                    fontSize: 11, cursor: 'pointer', fontFamily: "'Montserrat',sans-serif", fontWeight: 600,
                  }}
                >{showPwd ? 'Hide' : 'Show'}</button>
              </div>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171', marginBottom: 18,
              }}>{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? 'rgba(201,168,76,0.5)' : `linear-gradient(135deg, ${ACC}, #e8c060)`,
                border: 'none', borderRadius: 11,
                color: '#1a0d2e', fontWeight: 900, fontSize: 14,
                fontFamily: "'Montserrat',sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.5,
                transition: 'opacity 0.2s',
              }}
            >{loading ? 'Signing in…' : 'Sign In'}</button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
          Faith · Business · Impact
        </div>
      </div>
    </div>
  )
}
