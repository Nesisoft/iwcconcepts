import { useState } from 'react'
import SiteNav from '../components/SiteNav'
import SiteFooter from '../components/SiteFooter'
import { addGroupRequest } from '../utils/formStorage'
import { Building2, Send, CheckCircle2, Users } from 'lucide-react'

const BRAND = '#6c3fc5'
const BRAND2 = '#9333ea'
const GOLD  = '#C9A84C'

// Preset areas — staff can also type their own under "Other".
const AREAS = [
  'Leadership & Management',
  'Business & Entrepreneurship',
  'Faith & Purpose at Work',
  'Financial Management',
  'Sales & Marketing',
  'Customer Service Excellence',
  'Team Building',
  'Digital & Productivity Skills',
  'Personal Development',
]

export default function GroupTraining() {
  const [form, setForm] = useState({ orgName: '', contactName: '', email: '', phone: '', staffCount: '', areas: [], customAreas: '', message: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const valid = form.orgName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleArea = (a) => setForm(f => ({ ...f, areas: f.areas.includes(a) ? f.areas.filter(x => x !== a) : [...f.areas, a] }))

  async function submit(e) {
    e.preventDefault()
    if (!valid || sending) return
    setSending(true); setError('')
    try {
      await addGroupRequest({ ...form, staffCount: Number(form.staffCount) || 0 })
      setSent(true)
    } catch (err) {
      setError('Sorry — your request could not be sent. Please try again or contact us directly.')
    } finally {
      setSending(false)
    }
  }

  const inp = { width: '100%', boxSizing: 'border-box', border: '2px solid #e5e7eb', borderRadius: 12, padding: '13px 16px', fontSize: 15, fontFamily: 'inherit', outline: 'none', color: '#111827' }
  const lbl = { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <SiteNav solid />

      <section style={{ background: 'linear-gradient(135deg, #0f0a1a 0%, #1e0f3a 60%, #0f0a1a 100%)', padding: '130px 24px 60px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>For Organizations</div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 46px)', fontWeight: 900, margin: '0 auto 16px', lineHeight: 1.15, maxWidth: 720 }}>Train Your Team With Us</h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
          Have a company, church or group? Request training for your staff. Tell us how many people and what areas — we'll call you to tailor a package, then send a link your team registers with.
        </p>
      </section>

      <section style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircle2 size={64} color="#16a34a" style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: 26, fontWeight: 900, color: '#111827', margin: '0 0 10px' }}>Request received!</h2>
            <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
              Thank you — we've got your training request for <strong>{form.orgName}</strong>. Our team will reach out shortly to finalize the details and package.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <Building2 size={22} color={BRAND} />
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>Group training request</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={lbl}>Organization / Company *</label><input style={inp} value={form.orgName} onChange={e => set('orgName', e.target.value)} placeholder="e.g. Acme Ltd" /></div>
              <div><label style={lbl}>Contact person</label><input style={inp} value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Your name" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div><label style={lbl}>Email *</label><input style={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@company.com" /></div>
              <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+233 …" /></div>
            </div>
            <div style={{ maxWidth: 220 }}>
              <label style={lbl}><Users size={13} style={{ verticalAlign: -2 }} /> Number of staff to train</label>
              <input style={inp} type="number" min={1} value={form.staffCount} onChange={e => set('staffCount', e.target.value)} placeholder="e.g. 20" />
            </div>

            <div>
              <label style={lbl}>Training areas (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {AREAS.map(a => {
                  const on = form.areas.includes(a)
                  return (
                    <button type="button" key={a} onClick={() => toggleArea(a)} style={{
                      border: `2px solid ${on ? BRAND : '#e5e7eb'}`, background: on ? '#f5f0ff' : '#fff',
                      color: on ? BRAND : '#374151', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>{on ? '✓ ' : ''}{a}</button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={lbl}>Other areas (if not listed above)</label>
              <input style={inp} value={form.customAreas} onChange={e => set('customAreas', e.target.value)} placeholder="Tell us any other topics you'd like covered" />
            </div>
            <div>
              <label style={lbl}>Anything else?</label>
              <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Timeline, goals, preferred format…" />
            </div>

            <button type="submit" disabled={!valid || sending} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              border: 'none', borderRadius: 12, padding: '15px 0', fontWeight: 800, fontSize: 15,
              cursor: (valid && !sending) ? 'pointer' : 'not-allowed',
              background: (valid && !sending) ? `linear-gradient(135deg, ${BRAND}, ${BRAND2})` : '#e5e7eb',
              color: (valid && !sending) ? '#fff' : '#9ca3af',
              boxShadow: (valid && !sending) ? '0 4px 20px rgba(108,63,197,0.35)' : 'none',
            }}>
              <Send size={17} /> {sending ? 'Sending…' : 'Send Request'}
            </button>
            {error && <div style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}
          </form>
        )}
      </section>

      <SiteFooter />
    </div>
  )
}
