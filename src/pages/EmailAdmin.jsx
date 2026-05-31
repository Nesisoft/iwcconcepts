import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, saveSetting, sendTestEmail } from '../utils/formStorage'
import { Mail, Send, Check, RotateCcw, Info } from 'lucide-react'

const ACC  = '#2ECC71'
const DARK = '#0e0a1e'
const KEY  = 'emailSettings'

// Mirror of api/_email.js DEFAULT_EMAIL_SETTINGS (kept in sync for the editor).
const DEFAULTS = {
  fromName:  'IWC Concepts',
  fromEmail: '',
  replyTo:   'info@iwcconcepts.com',
  welcomeEnabled:    true,
  completionEnabled: true,
  reminderEnabled:   false,
  reminderDays:      5,
  welcomeSubject:    'Welcome to {{course}} 🎉',
  welcomeBody:
    'Hi {{name}},\n\nWelcome aboard! You\'re now enrolled in "{{course}}".\n\n' +
    'You can access your lessons anytime from your learning portal:\n{{portalUrl}}\n\n' +
    'We\'re excited to have you. Let\'s grow with purpose!\n\n— IWC Concepts',
  completionSubject: 'Congratulations on completing {{course}}! 🏆',
  completionBody:
    'Hi {{name}},\n\nYou did it — you\'ve completed "{{course}}". 🎉\n\n{{certificateLine}}' +
    'Keep up the great work, and explore more courses anytime:\n{{coursesUrl}}\n\n— IWC Concepts',
  reminderSubject:   'Pick up where you left off in {{course}}',
  reminderBody:
    'Hi {{name}},\n\nYou started "{{course}}" but haven\'t been back in a while. ' +
    'Your next lesson is waiting — keep your momentum going!\n\n{{portalUrl}}\n\n— IWC Concepts',
}

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 12, padding: '9px 12px', width: '100%', boxSizing: 'border-box',
  ...extra,
})
function Label({ children }) {
  return <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 5 }}>{children}</label>
}
function Fld({ label, children }) {
  return <div style={{ marginBottom: 14 }}><Label>{label}</Label>{children}</div>
}
function Toggle({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', width: 38, height: 21, cursor: 'pointer', flexShrink: 0, display: 'inline-block' }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
      <div style={{ position: 'absolute', inset: 0, background: checked ? ACC : 'rgba(255,255,255,0.18)', borderRadius: 20, transition: 'background .25s' }}>
        <div style={{ position: 'absolute', width: 15, height: 15, left: checked ? 20 : 3, top: 3, background: 'white', borderRadius: '50%', transition: 'left .25s' }} />
      </div>
    </label>
  )
}

export default function EmailAdmin() {
  const navigate = useNavigate()
  const [s,       setS]       = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [testTo,  setTestTo]  = useState('')
  const [testing, setTesting] = useState(false)
  const [testMsg, setTestMsg] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const stored = await getSetting(KEY)
      if (stored) setS({ ...DEFAULTS, ...stored })
    } catch (e) {
      console.warn(e)
    } finally {
      setLoading(false)
    }
  }

  function set(k, v) { setS(p => ({ ...p, [k]: v })); setSaved(false) }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSetting(KEY, s)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    setTesting(true); setTestMsg(null)
    try {
      // Save first so the test uses current edits
      await saveSetting(KEY, s)
      const res = await sendTestEmail(testTo || undefined, window.location.origin)
      if (res.skipped) {
        setTestMsg({ ok: false, text: res.reason === 'no_api_key'
          ? 'Email provider not configured. Set RESEND_API_KEY on the server.'
          : res.reason === 'no_sender'
          ? 'No verified sender. Fill in the "From email" (a Resend-verified address).'
          : 'Email was skipped (' + res.reason + ').' })
      } else {
        setTestMsg({ ok: true, text: `Test email sent to ${res.to}.` })
      }
    } catch (e) {
      setTestMsg({ ok: false, text: e.message })
    } finally {
      setTesting(false)
    }
  }

  function handleReset() {
    if (!confirm('Reset all email settings to defaults? Unsaved edits are lost.')) return
    setS(DEFAULTS); setSaved(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#27ae60)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Email Center</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}><RotateCcw size={13} /> Reset</button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: saved ? '#16a34a' : `linear-gradient(135deg,${ACC},#27ae60)`, border: 'none', borderRadius: 7, color: 'white', padding: '7px 18px', fontSize: 11, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : (
          <div style={{ maxWidth: 760, margin: '0 auto' }}>

            {/* Provider notice */}
            <div style={{ display: 'flex', gap: 10, background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              <Info size={16} color={ACC} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>Emails send through <strong>Resend</strong>. Set <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>RESEND_API_KEY</code> in your Vercel environment and verify a sender domain, then enter that verified address as the <strong>From email</strong> below.</div>
            </div>

            {/* Sender */}
            <Section title="Sender">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Fld label="From name"><input style={inp()} value={s.fromName} onChange={e => set('fromName', e.target.value)} /></Fld>
                <Fld label="From email (must be Resend-verified)"><input style={inp()} value={s.fromEmail} onChange={e => set('fromEmail', e.target.value)} placeholder="noreply@iwcconcepts.com" /></Fld>
              </div>
              <Fld label="Reply-to address"><input style={inp()} value={s.replyTo} onChange={e => set('replyTo', e.target.value)} placeholder="info@iwcconcepts.com" /></Fld>
            </Section>

            {/* Welcome */}
            <Section title="Welcome Email" sub="Sent when a learner enrolls in a course."
              toggle={<Toggle checked={s.welcomeEnabled} onChange={e => set('welcomeEnabled', e.target.checked)} />}>
              <Fld label="Subject"><input style={inp()} value={s.welcomeSubject} onChange={e => set('welcomeSubject', e.target.value)} /></Fld>
              <Fld label="Body"><textarea style={inp({ resize: 'vertical', lineHeight: 1.6, minHeight: 130 })} value={s.welcomeBody} onChange={e => set('welcomeBody', e.target.value)} /></Fld>
              <Placeholders items={['name', 'course', 'portalUrl', 'coursesUrl']} />
            </Section>

            {/* Completion */}
            <Section title="Completion Email" sub="Sent when a learner finishes every lesson in a course."
              toggle={<Toggle checked={s.completionEnabled} onChange={e => set('completionEnabled', e.target.checked)} />}>
              <Fld label="Subject"><input style={inp()} value={s.completionSubject} onChange={e => set('completionSubject', e.target.value)} /></Fld>
              <Fld label="Body"><textarea style={inp({ resize: 'vertical', lineHeight: 1.6, minHeight: 130 })} value={s.completionBody} onChange={e => set('completionBody', e.target.value)} /></Fld>
              <Placeholders items={['name', 'course', 'certificateLine', 'certificateUrl', 'coursesUrl', 'portalUrl']} />
            </Section>

            {/* Reminder */}
            <Section title="Reminder Email" sub="Nudges learners who started a course but stalled. Requires the scheduled job (cron)."
              toggle={<Toggle checked={s.reminderEnabled} onChange={e => set('reminderEnabled', e.target.checked)} />}>
              <Fld label="Send after this many days of inactivity">
                <input type="number" min={1} max={90} style={inp({ width: 120 })} value={s.reminderDays} onChange={e => set('reminderDays', Math.max(1, Math.min(90, Number(e.target.value))))} />
              </Fld>
              <Fld label="Subject"><input style={inp()} value={s.reminderSubject} onChange={e => set('reminderSubject', e.target.value)} /></Fld>
              <Fld label="Body"><textarea style={inp({ resize: 'vertical', lineHeight: 1.6, minHeight: 110 })} value={s.reminderBody} onChange={e => set('reminderBody', e.target.value)} /></Fld>
              <Placeholders items={['name', 'course', 'portalUrl']} />
            </Section>

            {/* Test */}
            <Section title="Send a Test">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 240px' }}>
                  <Label>Recipient (defaults to your admin email)</Label>
                  <input style={inp()} value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="you@example.com" />
                </div>
                <button onClick={handleTest} disabled={testing} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: `linear-gradient(135deg,${ACC},#27ae60)`, border: 'none', borderRadius: 8, color: 'white', padding: '10px 18px', fontSize: 12, fontWeight: 800, cursor: 'pointer', opacity: testing ? 0.6 : 1 }}>
                  <Send size={14} /> {testing ? 'Sending…' : 'Send Test'}
                </button>
              </div>
              {testMsg && (
                <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: testMsg.ok ? '#34d399' : '#f87171', background: testMsg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testMsg.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 8, padding: '10px 14px' }}>
                  {testMsg.text}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>The test uses your Welcome template with sample data and saves current edits first.</div>
            </Section>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, sub, toggle, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: sub ? 4 : 16 }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{title}</h2>
        {toggle}
      </div>
      {sub && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 16px' }}>{sub}</p>}
      {children}
    </div>
  )
}

function Placeholders({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginTop: 2 }}>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Placeholders:</span>
      {items.map(i => (
        <code key={i} style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', color: '#86efac', borderRadius: 4, padding: '2px 7px' }}>{`{{${i}}}`}</code>
      ))}
    </div>
  )
}
