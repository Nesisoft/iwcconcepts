import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSetting, saveSetting } from '../utils/formStorage'
import CertificateCard, { DEFAULT_CERT_TEMPLATE, certIdFor } from '../components/CertificateCard'
import { Award, Printer, RotateCcw, Check } from 'lucide-react'

const ACC  = '#C9A84C'
const DARK = '#0e0a1e'
const SETTING_KEY = 'certificateTemplate'

const inp = (extra = {}) => ({
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 8, color: 'white', fontFamily: "'Montserrat',sans-serif",
  fontSize: 12, padding: '8px 11px', width: '100%', boxSizing: 'border-box',
})

function Label({ children }) {
  return <label style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.55)', display: 'block', marginBottom: 4 }}>{children}</label>
}
function Fld({ label, children }) {
  return <div style={{ marginBottom: 12 }}><Label>{label}</Label>{children}</div>
}

// Sample data so the admin sees a realistic preview
const SAMPLE = {
  name: 'Ama Mensah',
  courseName: 'Faith-Driven Entrepreneurship',
  completedAt: new Date().toISOString(),
}

export default function CertificateAdmin() {
  const navigate = useNavigate()
  const [tpl,     setTpl]     = useState(DEFAULT_CERT_TEMPLATE)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const stored = await getSetting(SETTING_KEY)
      if (stored) setTpl({ ...DEFAULT_CERT_TEMPLATE, ...stored })
    } catch (e) {
      console.warn('Failed to load certificate template:', e)
    } finally {
      setLoading(false)
    }
  }

  function set(k, v) { setTpl(p => ({ ...p, [k]: v })); setSaved(false) }

  async function handleSave() {
    setSaving(true)
    try {
      await saveSetting(SETTING_KEY, tpl)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert('Save failed: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    if (!confirm('Reset the certificate to the default design? Unsaved edits will be lost.')) return
    setTpl(DEFAULT_CERT_TEMPLATE)
    setSaved(false)
  }

  const sampleCertId = certIdFor('sample@iwc', 'sample', SAMPLE.completedAt, tpl.idPrefix)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: DARK, fontFamily: "'Montserrat',sans-serif", color: 'white' }}>

      {/* Header */}
      <header style={{ background: 'linear-gradient(135deg,#120820,#1e0d38)', borderBottom: `2px solid ${ACC}`, padding: '11px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/admin')} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'white', padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>← Dashboard</button>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${ACC},#e8c060)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="#1A1A2E" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>Certificate Designer</div>
              <div style={{ fontSize: 8, color: ACC, letterSpacing: 2 }}>IWC CONCEPTS</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleReset} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 7, color: 'rgba(255,255,255,0.7)', padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            <RotateCcw size={13} /> Reset
          </button>
          <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: saved ? '#16a34a' : `linear-gradient(135deg,${ACC},#e8c060)`, border: 'none', borderRadius: 7, color: '#1A1A2E', padding: '7px 18px', fontSize: 11, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saved ? <><Check size={13} /> Saved</> : saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', flex: 1, overflow: 'hidden' }}>

        {/* ── Editor panel ──────────────────────────────────────────────────── */}
        <div style={{ background: '#130a24', borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto', padding: 18 }}>
          {loading ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, padding: '20px 0' }}>Loading…</div>
          ) : (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: ACC, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Organization</div>
              <Fld label="Organization Name"><input style={inp()} value={tpl.orgName} onChange={e => set('orgName', e.target.value)} /></Fld>
              <Fld label="Tagline (under the name)"><input style={inp()} value={tpl.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Faith · Business · Impact" /></Fld>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '18px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: ACC, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Wording</div>
              <Fld label="Heading"><input style={inp()} value={tpl.heading} onChange={e => set('heading', e.target.value)} placeholder="Certificate of Completion" /></Fld>
              <Fld label="Intro line (before the learner's name)"><input style={inp()} value={tpl.introLine} onChange={e => set('introLine', e.target.value)} /></Fld>
              <Fld label="Middle line (before the course title)"><input style={inp()} value={tpl.midLine} onChange={e => set('midLine', e.target.value)} /></Fld>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '18px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: ACC, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Signature & ID</div>
              <Fld label="Signature name"><input style={inp()} value={tpl.signatureName} onChange={e => set('signatureName', e.target.value)} /></Fld>
              <Fld label="Signature label"><input style={inp()} value={tpl.signatureLabel} onChange={e => set('signatureLabel', e.target.value)} placeholder="Authorized by" /></Fld>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Fld label="Date label"><input style={inp()} value={tpl.dateLabel} onChange={e => set('dateLabel', e.target.value)} /></Fld>
                <Fld label="Certificate ID prefix"><input style={inp()} value={tpl.idPrefix} onChange={e => set('idPrefix', e.target.value.toUpperCase().slice(0, 6))} placeholder="IWC" /></Fld>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '18px 0' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: ACC, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Colours</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Fld label="Accent (border / gold)">
                  <ColorRow value={tpl.accent} onChange={v => set('accent', v)} />
                </Fld>
                <Fld label="Course title colour">
                  <ColorRow value={tpl.brand} onChange={v => set('brand', v)} />
                </Fld>
              </div>

              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 10, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 8 }}>
                The certificate ID and completion date are generated automatically for each learner. The preview here uses sample data.
              </div>
            </>
          )}
        </div>

        {/* ── Preview panel ─────────────────────────────────────────────────── */}
        <div style={{ overflowY: 'auto', padding: '32px 24px', background: 'radial-gradient(ellipse at 50% 0%, rgba(91,45,142,0.15) 0%, transparent 60%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 800, margin: '0 auto 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Live Preview · sample learner</div>
            <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, color: 'rgba(255,255,255,0.75)', padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              <Printer size={13} /> Test Print
            </button>
          </div>

          <style>{`@media print { @page { size: landscape; margin: 0.5in; } body * { visibility: hidden; } #certificate-card, #certificate-card * { visibility: visible; } #certificate-card { position: absolute; left: 0; top: 0; } }`}</style>

          <CertificateCard
            name={SAMPLE.name}
            courseName={SAMPLE.courseName}
            completedAt={SAMPLE.completedAt}
            certId={sampleCertId}
            template={tpl}
          />
        </div>
      </div>
    </div>
  )
}

function ColorRow({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 34, height: 34, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, background: 'transparent', cursor: 'pointer', padding: 2, flexShrink: 0 }} />
      <input style={inp()} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
