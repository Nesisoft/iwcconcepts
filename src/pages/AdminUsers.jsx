import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUsers, inviteAdmin } from '../utils/formStorage'
import { getSupabase } from '../utils/supabase'
import { ArrowLeft, ShieldCheck, UserPlus, Mail, Clock } from 'lucide-react'

const ACC  = '#8B5CF6'
const DARK = '#0e0a1e'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '' }
}

export default function AdminUsers() {
  const navigate = useNavigate()
  const [admins,    setAdmins]    = useState([])
  const [envAdmins, setEnvAdmins] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [email, setEmail] = useState('')
  const [name,  setName]  = useState('')
  const [busy,  setBusy]  = useState(false)
  const [msg,   setMsg]   = useState(null)   // { ok, text }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const r = await getAdminUsers()
      setAdmins(r?.admins || [])
      setEnvAdmins(r?.envAdmins || [])
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setLoading(false)
    }
  }

  async function invite(e) {
    e?.preventDefault?.()
    const addr = email.trim()
    if (!EMAIL_RE.test(addr)) { setMsg({ ok: false, text: 'Enter a valid email address.' }); return }
    setBusy(true); setMsg(null)
    try {
      // Record the admin (so it shows in the list).
      await inviteAdmin(addr, name.trim())
      // Send the secure verification + password-setup link (Supabase magic link).
      const sb = getSupabase()
      if (!sb) {
        setMsg({ ok: true, text: `Added ${addr}. Supabase isn't configured here, so no email link was sent — set it up in Database Setup, then re-invite.` })
      } else {
        const { error } = await sb.auth.signInWithOtp({
          email: addr,
          options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/?pwsetup=1` },
        })
        if (error) throw new Error(error.message)
        setMsg({ ok: true, text: `✅ Invite sent to ${addr}. They'll get a secure link to verify their email and set a password, then can sign in here.` })
      }
      setEmail(''); setName('')
      await load()
    } catch (e) {
      setMsg({ ok: false, text: e.message })
    } finally {
      setBusy(false)
    }
  }

  const inp = { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', fontSize: 13, padding: '10px 12px', fontFamily: 'inherit', outline: 'none' }
  const card = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 18 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ArrowLeft size={13} /> Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#7c3aed)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={18} color="white" /></div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Admins</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'white', padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>↻ Refresh</button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Invite */}
          <form onSubmit={invite} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <UserPlus size={16} color={ACC} />
              <div style={{ fontSize: 13, fontWeight: 800 }}>Invite a new admin</div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 14 }}>
              Enter their name and email. We'll email them a secure link to verify their address and set a password
              (min 8 chars, with upper/lowercase and a number). They can then sign in at the admin login.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <input style={inp} placeholder="Full name" value={name} onChange={e => setName(e.target.value)} />
              <input style={inp} type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button type="submit" disabled={busy} style={{ background: busy ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg,${ACC},#7c3aed)`, border: 'none', borderRadius: 8, color: 'white', padding: '10px 18px', fontSize: 12, fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Mail size={14} /> {busy ? 'Sending…' : 'Send invite'}
            </button>
            {msg && (
              <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: msg.ok ? '#34d399' : '#f87171', lineHeight: 1.6 }}>{msg.text}</div>
            )}
          </form>

          {/* Current admins */}
          <div style={card}>
            <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>Current admins</div>
            {loading ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '10px 0' }}>Loading…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {envAdmins.map(a => (
                  <Row key={`env-${a.email}`} email={a.email} name="Configured (server)" badge="ENV" badgeColor="#3498DB" />
                ))}
                {admins.map(a => (
                  <Row key={a.email} email={a.email} name={a.name || '—'}
                    badge={a.status === 'invited' ? 'INVITED' : 'ACTIVE'}
                    badgeColor={a.status === 'invited' ? '#fbbf24' : '#34d399'}
                    sub={a.invitedAt ? `Invited ${formatDate(a.invitedAt)}${a.invitedBy ? ` by ${a.invitedBy}` : ''}` : ''} />
                ))}
                {envAdmins.length === 0 && admins.length === 0 && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>No admins recorded yet.</div>
                )}
              </div>
            )}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 14, lineHeight: 1.6 }}>
              An invited admin becomes active once they set their password. Accounts in <strong>ENV</strong> are configured on the server (ADMIN_EMAILS) and can't be removed here.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ email, name, badge, badgeColor, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', flexShrink: 0 }}>{(name && name !== '—' ? name : email)[0]}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
        {sub && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.35)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Clock size={9} /> {sub}</div>}
      </div>
      <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 9px', borderRadius: 20, background: `${badgeColor}22`, color: badgeColor, letterSpacing: 0.5, flexShrink: 0 }}>{badge}</span>
    </div>
  )
}
