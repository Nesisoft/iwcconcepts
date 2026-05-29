import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

const BRAND  = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD   = '#C9A84C'

// Reached after the user clicks the verification link in their email.
// main.jsx captured the magic-link tokens; here we apply them, confirm the
// session, and let the user create a password for their new account.
export default function SetPassword() {
  const navigate = useNavigate()
  const { user, applyStashedSession, updatePassword, signOut } = useCustomerAuth()

  const [verifying, setVerifying] = useState(true)
  const [validLink, setValidLink] = useState(false)
  const [email, setEmail]         = useState('')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    let cancelled = false
    async function verify() {
      try {
        // Apply tokens captured from the email link (one-shot).
        const applied = await applyStashedSession()
        const account = applied || user
        if (!cancelled) {
          if (account) { setValidLink(true); setEmail(account.email || '') }
          else setValidLink(false)
        }
      } catch {
        if (!cancelled) setValidLink(false)
      } finally {
        if (!cancelled) setVerifying(false)
      }
    }
    verify()
    return () => { cancelled = true }
  }, []) // eslint-disable-line

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }

    setSaving(true)
    try {
      await updatePassword(password)
      await signOut()
      navigate('/portal/login', {
        replace: true,
        state: { notice: 'Your account is ready! Sign in with your new password.' },
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: 'Inter, -apple-system, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg, ${GOLD}, #e8c060)`,
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, color: '#1A1A2E',
            fontFamily: "'Playfair Display', serif", marginBottom: 12,
          }}>IW</div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: 0.5 }}>IWC Concepts</div>
          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>Account Setup</div>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '36px 32px',
        }}>
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.6)' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', margin: '0 auto 16px',
                border: '3px solid rgba(201,168,76,0.2)', borderTopColor: GOLD,
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Verifying your link…
            </div>
          ) : !validLink ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
              <h1 style={{ color: 'white', fontSize: 18, fontWeight: 800, margin: '0 0 8px' }}>Link expired or invalid</h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
                This account-setup link is no longer valid. If you've already created your
                password, just sign in. Otherwise contact support for a new link.
              </p>
              <button onClick={() => navigate('/portal/login')} style={primaryBtn()}>Go to Sign In →</button>
            </div>
          ) : (
            <>
              <h1 style={{ color: 'white', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>Create your password</h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '0 0 24px' }}>
                {email ? <>Setting up <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{email}</strong>. </> : null}
                Choose a password to finish creating your account.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={lbl}>New password</label>
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters" autoFocus autoComplete="new-password"
                    style={inp()}
                  />
                </div>
                <div>
                  <label style={lbl}>Confirm password</label>
                  <input
                    type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password" autoComplete="new-password"
                    style={inp()}
                  />
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={saving} style={{ ...primaryBtn(saving), marginTop: 4 }}>
                  {saving ? '…' : 'Create Account →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }

function inp() {
  return {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10, color: 'white', fontSize: 14, padding: '12px 14px',
    fontFamily: 'inherit', outline: 'none',
  }
}

function primaryBtn(disabled = false) {
  return {
    width: '100%', border: 'none', borderRadius: 10, padding: '13px 0',
    fontWeight: 800, fontSize: 15, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
    color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(108,63,197,0.4)',
  }
}
