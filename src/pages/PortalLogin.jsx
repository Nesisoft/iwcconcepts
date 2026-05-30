import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

export default function PortalLogin() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { signIn } = useCustomerAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  // A success message may be passed from the SetPassword page after the user
  // finishes creating their password.
  const notice = location.state?.notice || ''
  const from   = location.state?.from?.pathname || '/portal'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: '#1A1A2E',
            fontFamily: "'Playfair Display', serif",
            marginBottom: 12,
          }}>IW</div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>IWC Concepts</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>Learning Portal</div>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
          padding: '36px 32px',
        }}>
          <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Sign in</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 24px' }}>
            Access your enrolled courses and learning content.
          </p>

          {notice && (
            <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#6ee7b7', marginBottom: 18 }}>
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoFocus autoComplete="email"
                style={inp()}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" autoComplete="current-password"
                style={inp()}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', border: 'none', borderRadius: 10, padding: '13px 0',
              fontWeight: 800, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
              color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(108,63,197,0.4)',
              marginTop: 4,
            }}>
              {loading ? '…' : 'Sign In →'}
            </button>
          </form>

          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', margin: '22px 0 0', lineHeight: 1.6 }}>
            Accounts are created when you enrol in a course with portal access.
            Check the email you registered with for your account setup link.
          </p>
        </div>

        <button onClick={() => navigate('/')} style={{
          display: 'block', margin: '20px auto 0', background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer',
        }}>← Back to Courses</button>
      </div>
    </div>
  )
}

function inp() {
  return {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'white', fontSize: 14, padding: '12px 14px',
    fontFamily: 'inherit', outline: 'none',
  }
}
