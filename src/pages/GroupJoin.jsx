import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getGroupByCode, registerGroupMember } from '../utils/formStorage'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { Users, CheckCircle2 } from 'lucide-react'

const BRAND = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD  = '#C9A84C'

function fmtDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) } catch { return '' }
}

export default function GroupJoin() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { sendAccountSetup } = useCustomerAuth()

  const [code, setCode]   = useState((params.get('code') || '').toUpperCase())
  const [group, setGroup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lookupError, setLookupError] = useState('')

  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone]   = useState(false)

  async function lookup(c) {
    setLoading(true); setLookupError(''); setGroup(null)
    try {
      const g = await getGroupByCode(c)
      setGroup(g)
    } catch (e) {
      setLookupError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (code) lookup(code)
    else setLoading(false)
  }, []) // eslint-disable-line

  async function submit(e) {
    e.preventDefault()
    if (submitting) return
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter your name and a valid email.'); return }
    setSubmitting(true); setError('')
    try {
      await registerGroupMember(code, name.trim(), email.trim())
      // Send the secure link so the staff member can set a password and sign in.
      try { await sendAccountSetup(email.trim()) } catch {}
      setDone(true)
      window.scrollTo({ top: 0 })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const inp = { width: '100%', boxSizing: 'border-box', border: '2px solid #e5e7eb', borderRadius: 12, padding: '14px 16px', fontSize: 15, fontFamily: 'inherit', outline: 'none', color: '#111827' }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 100%)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>← Home</button>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>Team Training Registration</div>
        <div style={{ color: GOLD, fontWeight: 800, fontSize: 13 }}>IWC CONCEPTS</div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '48px 24px 80px' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={64} color="#16a34a" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>You're enrolled{name ? `, ${name.split(' ')[0]}` : ''}!</h2>
            <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, margin: '0 0 8px' }}>
              You've been registered for your organization's training{group?.orgName ? ` with ${group.orgName}` : ''}.
            </p>
            <div style={{ background: '#f5f0ff', border: `1px solid ${BRAND}28`, borderRadius: 14, padding: '18px 22px', margin: '18px auto 24px', maxWidth: 400, textAlign: 'left' }}>
              <div style={{ fontWeight: 800, color: BRAND, fontSize: 14, marginBottom: 6 }}>📧 Check your email</div>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0, lineHeight: 1.7 }}>
                We've sent a verification link to <strong style={{ color: '#374151' }}>{email}</strong>. Click it to confirm your email and create a password — then sign in to start learning.
                {group?.expiresAt && <> Your access runs until <strong style={{ color: '#374151' }}>{fmtDate(group.expiresAt)}</strong>.</>}
              </p>
            </div>
            <button onClick={() => navigate('/portal/login')} style={primaryBtn()}>Go to Sign In →</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0' }}>Checking your training link…</div>
        ) : !group ? (
          <div style={{ maxWidth: 380, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: '0 0 8px', textAlign: 'center' }}>Enter your training code</h2>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, margin: '0 0 20px', textAlign: 'center' }}>
              Your organizer should have shared a code or link with you.
            </p>
            <input style={{ ...inp, textTransform: 'uppercase', textAlign: 'center', letterSpacing: 1 }} value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="GRP-XXXXXX" />
            {lookupError && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 600, marginTop: 10, textAlign: 'center' }}>{lookupError}</div>}
            <button onClick={() => code.trim() && lookup(code.trim())} disabled={!code.trim()} style={{ ...primaryBtn(!code.trim()), marginTop: 18 }}>Continue →</button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}><Users size={24} color="#fff" /></div>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Join {group.orgName}'s training</h2>
              <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>
                {group.planName ? `${group.planName} access` : 'Training access'}
                {group.expiresAt && ` · until ${fmtDate(group.expiresAt)}`}
                {` · ${group.seatsLeft} of ${group.seats} seats left`}
              </p>
            </div>

            {group.seatsLeft <= 0 ? (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '16px 20px', color: '#92400e', fontSize: 14, textAlign: 'center' }}>
                All seats for this training have been filled. Please contact your organizer.
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" autoFocus />
                <input style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" />
                {error && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}
                <button type="submit" disabled={submitting} style={primaryBtn(submitting)}>{submitting ? 'Registering…' : 'Register & Get Access →'}</button>
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', margin: 0 }}>You'll get an email to set your password, then you can sign in.</p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function primaryBtn(disabled = false) {
  return {
    width: '100%', display: 'inline-block', border: 'none', borderRadius: 50,
    padding: '15px 0', fontWeight: 800, fontSize: 16, cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#e5e7eb' : `linear-gradient(135deg, ${BRAND}, ${BRAND2})`,
    color: disabled ? '#9ca3af' : '#fff',
    boxShadow: disabled ? 'none' : '0 4px 20px rgba(108,63,197,0.4)',
  }
}
